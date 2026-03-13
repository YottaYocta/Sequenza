import mongoose, { Model, model, Schema, Types, type ObjectId } from 'mongoose';

export interface IUser {
	email: string;
	password: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			unique: true,
			lowercase: true
		},
		password: {
			type: String,
			required: true
		},
		name: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

export interface UserObject extends IUser {
	_id: Types.ObjectId;
}

export const User: Model<IUser> = mongoose.models.User || model<IUser>('User', userSchema);
