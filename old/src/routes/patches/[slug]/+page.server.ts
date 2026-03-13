import { connectDB } from '$lib/server/db';
import { User, type UserObject } from '$lib/server/models/User';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	await connectDB();

	const user: UserObject | null = await User.findById(params.slug).lean();

	if (user !== null) {
		return {
			_id: user._id.toString(),
			name: user.name,
			email: user.email,
			createdAt: user.createdAt
		};
	}
};
