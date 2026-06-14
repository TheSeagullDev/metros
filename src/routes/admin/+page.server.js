import { redirect, fail } from '@sveltejs/kit';
import crypto from "crypto";
import { supabaseAdmin } from '$lib/server/supabaseAdmin.js';
import { ADMIN_EMAILS } from '$env/static/private';

export async function load({ locals }) {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/');
	}

	const admins = ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());

	if (!admins.includes(user.email?.toLowerCase())) {
		throw redirect(303, '/');
	}
}

export const actions = {
	generateCode: async () => {
		const code = Math.floor(100000 + Math.random() * 900000).toString();

		const email = `guest-${crypto.randomUUID()}@guest.local`;

		const password = crypto.randomUUID();

		const { error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (error) {
			return fail(500, {
				error: error.message
			});
		}

		await supabaseAdmin.from('tickets').insert({
			email,
			paid: true
		});

		await supabaseAdmin.from('access_codes').insert({
			code,
			email,
			password,
			used: false
		});

		return {
			success: true,
			code
		};
	},
	createPhoneOrder: async ({ request }) => {
		const data = await request.formData();

		const email = data.get('email')?.toString().trim().toLowerCase();

		if (!email) {
			return fail(400, {
				error: 'Email required'
			});
		}

		// Prevent duplicates
		const { data: existing } = await supabaseAdmin
			.from('tickets')
			.select('email,password')
			.eq('email', email)
			.maybeSingle();

		if (existing) {
			return {
				ticket: {
					email: existing.email,
					password: existing.password
				}
			};
		}

		const password = crypto.randomUUID();

		const { error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (authError) {
			return fail(500, {
				error: authError.message
			});
		}

		const { error: ticketError } = await supabaseAdmin.from('tickets').insert({
			email,
			password,
			paid: true
		});

		if (ticketError) {
			return fail(500, {
				error: ticketError.message
			});
		}

		return {
			ticket: {
				email
			}
		};
	}
};