import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PatchModel } from '$lib/server/models/PatchModel';
import { Session } from '$lib/server/models/Session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Check for session cookie
	const sessionToken = cookies.get('session');

	if (!sessionToken) {
		// Redirect to login if no session
		return redirect(303, '/login');
	}

	// Verify session
	const session = await Session.findOne({ sessionToken });

	if (!session || session.expiresAt < new Date()) {
		// Invalid or expired session
		cookies.delete('session', { path: '/' });
		return redirect(303, '/login');
	}

	try {
		const { name, jsonData } = await request.json();

		if (!name || !jsonData) {
			return error(400, 'Missing required fields: name and jsonData');
		}

		// Create new patch
		const patch = await PatchModel.create({
			userId: session.userId,
			name,
			jsonData
		});

		return json({
			success: true,
			patchId: patch._id.toString(),
			message: 'Patch saved successfully'
		});
	} catch (err) {
		console.error('Error saving patch:', err);
		return error(500, 'Failed to save patch');
	}
};
