import { dev } from '$app/environment';
import { connectDB } from '$lib/server/db';
import { Session } from '$lib/server/models/Session';
import { User, type IUser } from '$lib/server/models/User';
import { registerSessionToken } from '$lib/server/util';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { ObjectId } from 'mongoose';
import type { Document } from 'mongoose';
import z from 'zod';

const loginSchema = z.object({
	email: z.email('Invalid email address'),
	password: z.string().min(6, 'Password must be 6 characters or longer')
});

export const actions = {
	default: async ({ request, cookies }) => {
		await connectDB();
		const formData = await request.formData();
		const data = {
			email: formData.get('email'),
			password: formData.get('password')
		};

		const result = loginSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				messages: result.error.issues.map((issue) => issue.message),
				email: ''
			});
		}

		try {
			const matchingUser: (IUser & { _id: ObjectId }) | null = await User.findOne({
				email: result.data.email
			});

			if (matchingUser) {
				const res = await bcrypt.compare(result.data.password, matchingUser.password);
				if (!res) {
					return fail(401, {
						messages: ['Incorrect Password'],
						email: result.data.email
					});
				}
			} else {
				return fail(400, {
					messages: ['No users found with this email'],
					email: ''
				});
			}

			await registerSessionToken(matchingUser._id, cookies);
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				messages: ['Something went wrong. Please try again'],
				email: ''
			});
		}

		throw redirect(303, '/explore');
	}
} satisfies Actions;
