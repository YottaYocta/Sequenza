import { invalidateSessionToken } from '$lib/server/util';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions = {
	default: async ({ cookies }) => {
		const sessionToken = cookies.get('session');
		if (sessionToken === undefined) {
			throw redirect(303, '/');
		}

		invalidateSessionToken(sessionToken);
		cookies.delete('session', { path: '/' });

		throw redirect(303, '/');
	}
} satisfies Actions;
