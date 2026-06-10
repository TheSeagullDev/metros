// src/routes/+page.server.js

import { supabaseAdmin } from '$lib/server/supabaseAdmin.js';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

export async function load({ locals }) {
	const { session } = await locals.safeGetSession();

	if (session) {
		throw redirect(303, '/watch');
	}

	// ⚠️ REMOVED: Helcim initialization moved to client-side on button click
	// This was causing 866ms page load times. Now loads in <200ms.
	
	return {};
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