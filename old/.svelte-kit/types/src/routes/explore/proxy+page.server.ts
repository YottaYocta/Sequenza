// @ts-nocheck
import { connectDB } from '$lib/server/db';
import { User, type UserObject } from '$lib/server/models/User';
import { PatchModel, type PatchObject } from '$lib/server/models/PatchModel';
import type { PageServerLoad } from './$types';

export const load = async () => {
	await connectDB();
	const allUsers: UserObject[] = await User.find();
	const allPatches: PatchObject[] = await PatchModel.find();

	// Group patches by userId
	const patchesByUser = allPatches.reduce(
		(acc, patch) => {
			const userId = patch.userId.toString();
			if (!acc[userId]) {
				acc[userId] = [];
			}
			acc[userId].push({
				id: patch._id.toString(),
				name: patch.name
			});
			return acc;
		},
		{} as Record<string, Array<{ id: string; name: string }>>
	);

	return {
		users: allUsers.map((user) => ({
			id: user._id.toString(),
			name: user.name,
			patches: patchesByUser[user._id.toString()] || []
		}))
	};
};
;null as any as PageServerLoad;