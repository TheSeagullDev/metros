import { json } from '@sveltejs/kit';

import crypto from 'crypto';

import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { HELCIM_API_TOKEN, DISCORD_WEBHOOK_URL } from '$env/static/private';

export async function POST({ request }) {
	const { rawDataResponse, checkoutToken } = await request.json();

	// TODO:
	// VERIFY PAYMENT WITH HELCIM
	const { data: payment, error: paymentError } = await supabaseAdmin
		.from('payments')
		.select('secretToken')
		.eq('checkoutToken', checkoutToken)
		.single();

	if (paymentError || !payment) {
		return json({ error: 'Payment record not found' }, { status: 400 });
	}

	const secretToken = payment.secretToken;

	console.log(rawDataResponse, checkoutToken);

	const parsed = JSON.parse(rawDataResponse);

	const paymentData = parsed.data.data;
	const helcimHash = parsed.data.hash;

	const yourHash = crypto
		.createHash('sha256')
		.update(JSON.stringify(paymentData) + secretToken)
		.digest('hex');

	if (yourHash !== helcimHash) {
		console.error('Invalid Helcim signature');

		return json(
			{
				error: 'Payment verification failed'
			},
			{
				status: 400
			}
		);
	}

	const customerCode = JSON.parse(rawDataResponse).data.data.customerCode;
	console.log(customerCode);

	const url = `https://api.helcim.com/v2/customers/?customerCode=${customerCode}`;
	const options = {
		method: 'GET',
		headers: {
			accept: 'application/json',
			'api-token': HELCIM_API_TOKEN
		}
	};

	const res = await fetch(url, options);
	const data = await res.json();
	console.log(data);
	const email = data[0].billingAddress.email.toLowerCase();
	console.log(email);

	// NEW USER

	let password = crypto.randomUUID();

	// create auth user

	const { data: existingTicket } = await supabaseAdmin
		.from('tickets')
		.select("*")
		.eq('email', email)
		.maybeSingle();

	if (existingTicket) {
		console.log("ticket", existingTicket)
		await fetch(DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				embeds: [
					{
						title: 'Duplicate Payment Detected',
						color: 16753920, // orange
						fields: [{ name: 'Email', value: email, inline: true }],
						timestamp: new Date().toISOString()
					}
				]
			})
		});
		password = existingTicket.password;
		return json({
			success: true,

			email,

			password
		});
	}

	const { error: createError } = await supabaseAdmin.auth.admin.createUser({
		email,

		password,

		email_confirm: true
	});

	// create ticket

	await supabaseAdmin.from('tickets').insert({
		email,

		password,

		paid: true,

		created_at: new Date()
	});

	return json({
		success: true,

		email,

		password
	});
}
