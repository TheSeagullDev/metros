// src/routes/api/playback/+server.js

import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';

import { MUX_SIGNING_KEY, MUX_SIGNING_KEY_ID } from '$env/static/private';
import { PUBLIC_MUX_PLAYBACK_ID } from '$env/static/public';

export async function GET({ locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return new Response('Unauthorized', {
			status: 401
		});
	}

	const privateKey = MUX_SIGNING_KEY.replace(/\\n/g, '\n');

	const token = jwt.sign(
		{
			sub: PUBLIC_MUX_PLAYBACK_ID,
			aud: 'v',
			exp: Math.floor(Date.now() / 1000) + 60 * 60
		},
		privateKey,
		{
			algorithm: 'RS256',
			keyid: MUX_SIGNING_KEY_ID
		}
	);

	return json({
		token: token
	});
}
