// src/routes/checkout/+page.server.js

import { HELCIM_API_TOKEN } from '$env/static/private';

export async function load() {
	const response = await fetch('https://api.helcim.com/v2/helcim-pay/initialize', {
		method: 'POST',
		headers: {
			'api-token': HELCIM_API_TOKEN,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			paymentType: 'purchase',
			amount: 5.0,
			currency: 'USD',
			displayContactFields: 1,
			customStyling: {brandColor: 'EF6823'}
		})
	});

	const data = await response.json();

	return {
		checkoutToken: data.checkoutToken
	};
}
