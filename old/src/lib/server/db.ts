import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

let isConnected = false;

export const connectDB = async () => {
	if (isConnected) {
		console.log('Using existing MongoDB connection');
		return;
	}

	try {
		console.log('Trying to connect to' + env.MONGODB_URI);
		const db = await mongoose.connect(env.MONGODB_URI);
		isConnected = db.connections[0].readyState === 1;
		console.log('MongoDB connected successfully');
	} catch (error) {
		console.error('MongoDB connection error: ', error);
		throw error;
	}
};
