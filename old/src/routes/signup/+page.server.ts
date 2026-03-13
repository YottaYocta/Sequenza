import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models/User';
import { fail, redirect, type Action, type Actions } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import z from 'zod';

const signupSchema = z
	.object({
		email: z.email('Invalid Email Address'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string()
	})
	.refine(
		(data) => {
			return data.password === data.confirmPassword;
		},
		{
			message: "Passwords don't match",
			path: ['confirmPassword']
		}
	);

export const actions = {
	default: async ({ request }) => {
		await connectDB();
		const formData = await request.formData();
		const data = {
			email: formData.get('email'),
			password: formData.get('password'),
			confirmPassword: formData.get('confirmPassword')
		};
		const result = signupSchema.safeParse(data);
		if (!result.success) {
			const errors = result.error.issues.map((issue) => issue.message);
			return fail(400, {
				errors: errors,
				email: data.email
			});
		}

		try {
			const existingUser = await User.findOne({ email: result.data.email });

			if (existingUser) {
				return fail(400, {
					errors: ['Email already exists'],
					email: data.email
				});
			}

			const hashedPassword = await bcrypt.hash(result.data.password, 10);

			await User.create({
				name: result.data.email.split('@')[0],
				email: result.data.email,
				password: hashedPassword
			});
		} catch (error) {
			console.error('Signup error:', error);
			return fail(500, {
				errors: ['Something went wrong. Please try again'],
				email: result.data.email
			});
		}

		throw redirect(303, '/login');
	}
} satisfies Actions;
