import { connectDB } from '$lib/server/db';
import { User, type UserObject } from '$lib/server/models/User';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	await connectDB();
	const allUsers: UserObject[] = await User.find();

	return {
		users: allUsers.map((user) => ({
			id: user._id.toString(),
			name: user.name
		}))
	};
};
