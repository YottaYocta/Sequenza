import { refreshSessionToken, validateSessionToken } from '$lib/server/util';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('session');
	return { authenticated: sessionToken ? await refreshSessionToken(sessionToken, cookies) : false };
};
