// @ts-nocheck
import { refreshSessionToken, validateSessionToken } from '$lib/server/util';
import type { LayoutServerLoad } from './$types';

export const load = async ({ cookies }: Parameters<LayoutServerLoad>[0]) => {
	const sessionToken = cookies.get('session');
	const res = sessionToken ? await refreshSessionToken(sessionToken, cookies) : null;
	return { userId: res?._id.toString() ?? null };
};
