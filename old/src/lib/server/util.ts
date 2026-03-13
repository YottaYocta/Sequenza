import type { Cookies } from '@sveltejs/kit';
import { Session } from './models/Session';
import { dev } from '$app/environment';
import type { ObjectId } from 'mongoose';
import { connectDB } from './db';
import { User, type UserObject } from './models/User';

const TOKEN_EXP_TIME = 2 * 24 * 60 * 60 * 1000; // two days

export const registerSessionToken = async (userID: ObjectId, cookies: Cookies): Promise<void> => {
	await connectDB();
	const sessionToken = crypto.randomUUID();

	const expiresAt = new Date(Date.now() + TOKEN_EXP_TIME);

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
		maxAge: TOKEN_EXP_TIME
	});
};

export const validateSessionToken = async (sessionToken: string): Promise<UserObject | null> => {
	try {
		await connectDB();
		const matchingSessionToken = await Session.findOne({ sessionToken: sessionToken }).lean();

		// session not found
		if (matchingSessionToken === null) {
			return null;
		}

		// session found

		// expired
		if (matchingSessionToken.expiresAt.getTime() < Date.now()) {
			await Session.deleteOne({ sessionToken: sessionToken });

			return null;
		}

		const authenticatedUser = await User.findById(matchingSessionToken.userId).lean();

		return authenticatedUser;
	} catch (error) {
		console.error('Validate Token Error:', error);
		return null;
	}
};

export const refreshSessionToken = async (
	sessionToken: string,
	cookies: Cookies
): Promise<UserObject | null> => {
	const res = await validateSessionToken(sessionToken);
	if (res) {
		await Session.updateOne({ sessionToken }, { expiresAt: new Date(Date.now() + TOKEN_EXP_TIME) });
		return res;
	} else {
		cookies.delete('session', { path: '/' });
		return null;
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
