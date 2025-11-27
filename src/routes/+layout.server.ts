import { connectDB } from '$lib/server/db';
import { Session } from '$lib/server/models/Session';
import { validateSessionToken } from '$lib/server/util';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('session');
	return { authenticated: sessionToken ? await validateSessionToken(sessionToken) : false };
};
