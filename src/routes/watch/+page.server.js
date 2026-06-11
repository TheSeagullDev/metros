// src/routes/watch/+page.server.js

import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';

import { MUX_SIGNING_KEY, MUX_SIGNING_KEY_ID } from '$env/static/private';

export async function load({ locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/');
	}

	try {
		const { data: stream, error } = await locals.supabase
			.from('streams')
			.select('*')
			.eq('active', true)
			.single();

		if (error) {
			console.error('[STREAM_LOAD_ERROR]', error);
			throw new Error('No active stream');
		}

		if (!stream) {
			throw new Error('No stream found');
		}

		const privateKey = MUX_SIGNING_KEY.replace(/\\n/g, '\n');

		const token = jwt.sign(
			{
				sub: stream.playback_id,
				aud: 'v',
				exp: Math.floor(Date.now() / 1000) + 600 * 60
			},
			privateKey,
			{
				algorithm: 'RS256',
				keyid: MUX_SIGNING_KEY_ID
			}
		);

		return {
			stream,
			token
		};
	} catch (error) {
		console.error('[WATCH_PAGE_LOAD_ERROR]', error);
		throw redirect(303, '/');
	}
}