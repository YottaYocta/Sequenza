import type { Cookies } from '@sveltejs/kit';
import { Session } from './models/Session';
import { dev } from '$app/environment';
import type { ObjectId } from 'mongoose';

export const registerSessionToken = async (userID: ObjectId, cookies: Cookies): Promise<void> => {
	const sessionToken = crypto.randomUUID();

	const maxAge = 1 * 1 * 5 * 60 * 1000; // five minutes
	const expiresAt = new Date(Date.now() + maxAge); // five minutes

	await Session.create({
		userId: userID,
		sessionToken,
		expiresAt
	});

	cookies.set('session', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: maxAge
	});
};
