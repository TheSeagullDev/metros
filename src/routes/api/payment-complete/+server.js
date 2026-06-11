// src/routes/api/payment-complete/+server.js
import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { HELCIM_API_TOKEN, DISCORD_WEBHOOK_URL } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { rawDataResponse, checkoutToken } = await request.json();

		// Get payment record
		const { data: payment, error: paymentError } = await supabaseAdmin
			.from('payments')
			.select('secretToken')
			.eq('checkoutToken', checkoutToken)
			.single();

		if (paymentError || !payment) {
			console.error('[PAYMENT_COMPLETE] Payment record not found:', checkoutToken);
			return json({ error: 'Payment record not found' }, { status: 400 });
		}

		const secretToken = payment.secretToken;

		// Validate Helcim signature
		const parsed = JSON.parse(rawDataResponse);
		const paymentData = parsed.data.data;
		const helcimHash = parsed.data.hash;

		const yourHash = crypto
			.createHash('sha256')
			.update(JSON.stringify(paymentData) + secretToken)
			.digest('hex');

		if (yourHash !== helcimHash) {
			console.error('[PAYMENT_COMPLETE] Invalid Helcim signature:', { checkoutToken });
			return json({ error: 'Payment verification failed' }, { status: 400 });
		}

		const customerCode = paymentData.customerCode;
		const transactionId = paymentData.transactionId;

		console.log('[PAYMENT_COMPLETE] Valid payment:', { transactionId, customerCode });

		// Fetch customer email from Helcim
		const helcimUrl = `https://api.helcim.com/v2/customers/?customerCode=${customerCode}`;
		const helcimRes = await fetch(helcimUrl, {
			method: 'GET',
			headers: {
				accept: 'application/json',
				'api-token': HELCIM_API_TOKEN
			}
		});

		if (!helcimRes.ok) {
			console.error('[PAYMENT_COMPLETE] Helcim API error:', helcimRes.status);
			return json({ error: 'Failed to fetch customer from Helcim' }, { status: 500 });
		}

		const helcimData = await helcimRes.json();

		// NORMALIZE EMAIL: trim + lowercase
		const rawEmail = helcimData[0]?.billingAddress?.email;
		if (!rawEmail) {
			console.error('[PAYMENT_COMPLETE] No email from Helcim:', { transactionId });
			return json({ error: 'No email found in payment data' }, { status: 400 });
		}

		const email = rawEmail.trim().toLowerCase();
		console.log('[PAYMENT_COMPLETE] Processing email:', {
			originalEmail: rawEmail,
			normalizedEmail: email,
			transactionId
		});

		// Check for duplicate ticket (email-based)
		const { data: existingTicket, error: ticketError } = await supabaseAdmin
			.from('tickets')
			.select('email, password')
			.eq('email', email)
			.maybeSingle();

		if (ticketError && ticketError.code !== 'PGRST116') {
			// PGRST116 = no rows found (expected for new users)
			console.error('[PAYMENT_COMPLETE] Database query error:', ticketError);
			return json({ error: 'Database error' }, { status: 500 });
		}

		// DUPLICATE DETECTED
		if (existingTicket) {
			console.warn('[PAYMENT_COMPLETE] Duplicate payment detected:', { email, transactionId });

			// Send Discord alert
			try {
				await fetch(DISCORD_WEBHOOK_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						content: '<@&1514658783652217048>',
						allowed_mentions: {
							roles: ['1514658783652217048']
						},
						embeds: [
							{
								title: '⚠️ Duplicate Payment Detected',
								color: 16753920, // orange
								fields: [
									{ name: 'Email', value: email, inline: true },
									{ name: 'Transaction ID', value: transactionId, inline: true },
									{ name: 'Existing Ticket', value: existingTicket.email, inline: false },
									{
										name: 'Action Needed',
										value: 'Manually void/refund in Helcim dashboard',
										inline: false
									}
								],
								timestamp: new Date().toISOString()
							}
						]
					})
				}).catch((err) => console.error('[DISCORD_ERROR]', err));
			} catch (discordErr) {
				console.error('[PAYMENT_COMPLETE] Failed to send Discord alert:', discordErr);
			}

			// Return existing password - user can log in with the original purchase
			return json({
				success: true,
				email,
				password: existingTicket.password,
				isDuplicate: true
			});
		}

		// NEW USER - create auth account and ticket
		console.log('[PAYMENT_COMPLETE] Creating new user and ticket:', { email, transactionId });

		const password = crypto.randomUUID();

		// Create Supabase auth user
		const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (createError) {
			console.error('[PAYMENT_COMPLETE] Auth user creation failed:', createError);

			// Check if user already exists
			if (createError.message?.includes('already exists')) {
				console.warn(
					'[PAYMENT_COMPLETE] User already exists in auth, creating ticket entry:',
					email
				);

				// Still create ticket entry (user exists but has no ticket record)
				const { error: ticketInsertError } = await supabaseAdmin.from('tickets').insert({
					email,
					password,
					paid: true,
					created_at: new Date().toISOString()
				});

				if (ticketInsertError) {
					console.error('[PAYMENT_COMPLETE] Ticket creation failed:', ticketInsertError);
					return json({ error: 'Failed to create ticket record' }, { status: 500 });
				}

				return json({
					success: true,
					email,
					password
				});
			}

			return json({ error: 'Failed to create user account' }, { status: 500 });
		}

		// Create ticket record
		const { error: ticketInsertError } = await supabaseAdmin.from('tickets').insert({
			email,
			password,
			paid: true,
			created_at: new Date().toISOString()
		});

		if (ticketInsertError) {
			console.error('[PAYMENT_COMPLETE] Ticket creation failed:', ticketInsertError);

			// User was created but ticket failed - log this for manual recovery
			console.error('[PAYMENT_COMPLETE] CRITICAL: User created but ticket insertion failed:', {
				email,
				authUserId: authData.user.id,
				transactionId
			});

			return json({ error: 'Failed to create ticket record' }, { status: 500 });
		}

		console.log('[PAYMENT_COMPLETE] Success:', {
			email,
			transactionId,
			authUserId: authData.user.id
		});

		return json({
			success: true,
			email,
			password
		});
	} catch (error) {
		console.error('[PAYMENT_COMPLETE] Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
}
