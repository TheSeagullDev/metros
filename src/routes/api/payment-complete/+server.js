import { json }
	from '@sveltejs/kit';

import crypto from 'crypto';

import {
	supabaseAdmin
} from '$lib/server/supabaseAdmin';

export async function POST({
	request
}) {

	const {
		email,
		paymentId
	} = await request.json();

	// TODO:
	// VERIFY PAYMENT WITH HELCIM

	if (!paymentId) {
		return json({
			error: 'Missing payment'
		}, {
			status: 400
		});
	}

	// check if ticket/user already exists

	const {
		data: existingTicket
	} = await supabaseAdmin
		.from('tickets')
		.select('*')
		.eq('email', email)
		.single();

	let password;

	// EXISTING USER

	if (existingTicket) {

		password =
			existingTicket.password;

		// re-grant access if needed

		await supabaseAdmin
			.from('tickets')
			.update({
				paid: true
			})
			.eq('email', email);

	} else {

		// NEW USER

		password =
			crypto.randomUUID();

		// create auth user

		const {
			error: createError
		} =
			await supabaseAdmin
				.auth.admin
				.createUser({

					email,

					password,

					email_confirm: true
				});

		if (createError) {

			console.error(createError);

			return json({
				error:
					createError.message
			}, {
				status: 500
			});
		}

		// create ticket

		await supabaseAdmin
			.from('tickets')
			.insert({

				email,

				password,

				paid: true,

				created_at:
					new Date()
			});
	}

	return json({
		success: true,

		email,

		password
	});
}