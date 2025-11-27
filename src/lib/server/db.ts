import mongoose from 'mongoose';
import { MONGODB_URI } from '$env/static/private';

let isConnected = false;

export const connectDB = async () => {
	if (isConnected) {
		console.log('Using existing MongoDB connection');
		return;
	}

	try {
		const db = await mongoose.connect(MONGODB_URI);
		isConnected = db.connections[0].readyState === 1;
		console.log('MongoDB connected successfully');
	} catch (error) {
		console.error('MongoDB connection error: ', error);
		throw error;
	}
};
