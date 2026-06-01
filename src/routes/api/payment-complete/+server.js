import { json } from '@sveltejs/kit';

import crypto from 'crypto';

import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { HELCIM_API_TOKEN } from '$env/static/private';

export async function POST({ request }) {
	const { rawDataResponse, checkoutToken } = await request.json();

	// TODO:
	// VERIFY PAYMENT WITH HELCIM

	console.log(rawDataResponse, checkoutToken)

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
	const email = data[0].billingAddress.email;
	console.log(email);

	

	// check if ticket/user already exists

	const { data: existingTicket } = await supabaseAdmin
		.from('tickets')
		.select('*')
		.eq('email', email)
		.single();

	let password;

	// EXISTING USER

	if (existingTicket) {
		password = existingTicket.password;

		// re-grant access if needed

		await supabaseAdmin
			.from('tickets')
			.update({
				paid: true
			})
			.eq('email', email);
	} else {
		// NEW USER

		password = crypto.randomUUID();

		// create auth user

		const { error: createError } = await supabaseAdmin.auth.admin.createUser({
			email,

			password,

			email_confirm: true
		});

		if (createError) {
			console.error(createError);

			return json(
				{
					error: createError.message
				},
				{
					status: 500
				}
			);
		}

		// create ticket

		await supabaseAdmin.from('tickets').insert({
			email,

			password,

			paid: true,

			created_at: new Date()
		});
	}

	return json({
		success: true,

		email,

		password
	});
}
