import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PatchModel, type PatchObject } from '$lib/server/models/PatchModel';
import { refreshSessionToken } from '$lib/server/util';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('session');

	if (!sessionToken) {
		// Redirect to login if no session
		return redirect(303, '/login');
	}

	const validatedUser = await refreshSessionToken(sessionToken, cookies);

	if (validatedUser === null) {
		return redirect(303, '/login');
	}

	let patch: PatchObject;
	try {
		const { name, jsonData } = await request.json();

		if (!name || !jsonData) {
			return error(400, 'Missing required fields: name and jsonData');
		}

		// Create new patch
		patch = await PatchModel.create({
			userId: validatedUser._id,
			name,
			jsonData
		});
	} catch (err) {
		console.error('Error saving patch:', err);
		return error(500, 'Failed to save patch');
	}

	return redirect(303, `patch/${patch._id.toString()}`);
};
