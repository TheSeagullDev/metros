// src/routes/+page.server.js

import { HELCIM_API_TOKEN } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin.js';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

export async function load({ locals }) {
	const { session } = await locals.safeGetSession();

	if (session) {
		throw redirect(303, '/watch');
	}
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

	const data = await response.json();

	await supabaseAdmin.from('payments').insert({
		checkoutToken: data.checkoutToken,

		secretToken: data.secretToken
	});

	return {
		checkoutToken: data.checkoutToken
	};
}

export const actions = {
	redeemCode: async ({ request }) => {
		const formData = await request.formData();
		console.log("verifying code!");

		const code = formData.get('code');

		const { data: accessCode } = await supabaseAdmin
			.from('access_codes')
			.select('*')
			.eq('code', code)
			.eq('used', false)
			.single();

		if (!accessCode) {
			return fail(400, {
				error: 'Invalid code'
			});
		}

		await supabaseAdmin.from('access_codes').update({ used: true }).eq('code', code);

		return {
			email: accessCode.email,
			password: accessCode.password
		};
	}
};
