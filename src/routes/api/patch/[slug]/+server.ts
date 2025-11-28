import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PatchModel } from '$lib/server/models/PatchModel';
import { connectDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	await connectDB();
	const patchId = params.slug;

	try {
		const patch = await PatchModel.findById(patchId);

		if (!patch) {
			return error(404, 'Patch not found');
		}

		return json({
			id: patch._id.toString(),
			name: patch.name,
			jsonData: patch.jsonData,
			userId: patch.userId.toString(),
			createdAt: patch.createdAt,
			updatedAt: patch.updatedAt
		});
	} catch (err) {
		console.error('Error saving patch:', err);
		return error(500, 'Failed to save patch');
	}
};
