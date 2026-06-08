import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request }) {
	const { email } = await request.json();

    const normalizedEmail = email.trim().toLowerCase()

	const ticket = await supabaseAdmin.from('tickets').select('email').eq('email', normalizedEmail).maybeSingle();

	if (!ticket.data) {
		return json({ success: false });
	}

	return json({ success: true });
}
