// src/routes/api/helcim-init/+server.js

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { HELCIM_API_TOKEN } from '$env/static/private';

export async function POST({ request }) {
	try {
		const response = await fetch('https://api.helcim.com/v2/helcim-pay/initialize', {
			method: 'POST',
			headers: {
				'api-token': HELCIM_API_TOKEN,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				paymentType: 'purchase',
				amount: Math.round(Math.random() * 1000) / 100,
				currency: 'USD',
				displayContactFields: 1,
				customStyling: { brandColor: 'EF6823' }
			})
		});

		if (!response.ok) {
			console.error('[HELCIM_API_ERROR]', response.status);
			return json({ error: 'Helcim API failed' }, { status: 500 });
		}

		const data = await response.json();

		// Insert payment record
		const { error: insertError } = await supabaseAdmin.from('payments').insert({
			checkoutToken: data.checkoutToken,
			secretToken: data.secretToken
		});

		if (insertError) {
			console.error('[PAYMENT_RECORD_INSERT_ERROR]', insertError);
			return json({ error: 'Failed to create payment record' }, { status: 500 });
		}

		return json({
			checkoutToken: data.checkoutToken
		});
	} catch (error) {
		console.error('[HELCIM_INIT_ERROR]', error);
		return json({ error: 'Failed to initialize payment' }, { status: 500 });
	}
}
