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
		console.error('Validate Token Error:', error);
		return false;
	}

	return true;
};

export const refreshSessionToken = async (sessionToken: string, cookies: Cookies) => {
	if (await validateSessionToken(sessionToken)) {
		await Session.updateOne(
			{ sessionToken },
			{ expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
		);
		return true;
	} else {
		cookies.delete('session', { path: '/' });
		return false;
	}
};

export const invalidateSessionToken = async (sessionToken: string): Promise<boolean> => {
	try {
		await connectDB();
		const matchingSessionToken = await Session.findOne({ sessionToken: sessionToken }).lean();

		// session not found
		if (matchingSessionToken === null) {
			return true;
		}

		await Session.deleteOne({ sessionToken });
		return true;
	} catch (error) {
		console.error('Logout Error:', error);
		return false;
	}
};
