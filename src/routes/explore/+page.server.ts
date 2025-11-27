import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models/User';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	await connectDB();
	const allUsers = await User.find();

	return {
		users: allUsers.map((user) => user.name)
	};
};
