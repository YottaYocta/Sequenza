import type { Cookies } from '@sveltejs/kit';
import { Session } from './models/Session';
import { dev } from '$app/environment';
import type { ObjectId } from 'mongoose';
import { connectDB } from './db';

export const registerSessionToken = async (userID: ObjectId, cookies: Cookies): Promise<void> => {
	await connectDB();
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

export const validateSessionToken = async (sessionToken: string): Promise<boolean> => {
	try {
		await connectDB();
		const matchingSessionToken = await Session.findOne({ sessionToken: sessionToken }).lean();

		// session not found
		if (matchingSessionToken === null) {
			return false;
		}

		// session found

		// expired
		if (matchingSessionToken.expiresAt.getTime() < Date.now()) {
			await Session.deleteOne({ sessionToken: sessionToken });

			return false;
		}
	} catch (error) {
		console.error('Error in main layout:', error);
		return false;
	}

	return true;
};
