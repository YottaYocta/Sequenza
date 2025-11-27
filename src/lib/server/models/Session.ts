import mongoose, { model } from 'mongoose';
import { Model, Schema } from 'mongoose';

export interface ISession {
	userId: mongoose.Types.ObjectId;
	sessionToken: string;
	expiresAt: Date;
	createdAt: Date;
}

const sessionSchema = new Schema<ISession>({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	sessionToken: {
		type: String,
		required: true,
		unique: true
	},
	expiresAt: {
		type: Date,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

export const Session: Model<ISession> =
	mongoose.models.Session || model<ISession>('Session', sessionSchema);
