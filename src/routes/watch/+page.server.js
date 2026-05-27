import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/');
	}
}
