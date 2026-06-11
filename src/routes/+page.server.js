// src/routes/+page.server.js

import { supabaseAdmin } from '$lib/server/supabaseAdmin.js';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { ERROR_CODES } from '$lib/stores/notificationStore.js';

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
		const code = formData.get('code');

		try {
			const { data: accessCode, error } = await supabaseAdmin
				.from('access_codes')
				.select('*')
				.eq('code', code)
				.eq('used', false)
				.single();

			if (error || !accessCode) {
				return fail(400, {
					errorCode: ERROR_CODES.ACCESS_CODE_INVALID
				});
			}

			const { error: updateError } = await supabaseAdmin
				.from('access_codes')
				.update({ used: true })
				.eq('code', code);

			if (updateError) {
				console.error('[ACCESS_CODE_UPDATE_ERROR]', updateError);
				return fail(500, {
					errorCode: ERROR_CODES.UNEXPECTED_ERROR
				});
			}

			return {
				email: accessCode.email,
				password: accessCode.password
			};
		} catch (error) {
			console.error('[ACCESS_CODE_ERROR]', error);
			return fail(500, {
				errorCode: ERROR_CODES.UNEXPECTED_ERROR
			});
		}
	}
};
