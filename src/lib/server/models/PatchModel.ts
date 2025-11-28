import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface IPatch {
	userId: Types.ObjectId;
	name: string;
	jsonData: string; // Serialized patch JSON
	createdAt: Date;
	updatedAt: Date;
}

const patchSchema = new Schema<IPatch>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		name: {
			type: String,
			required: true
		},
		jsonData: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

export interface PatchObject extends IPatch {
	_id: Types.ObjectId;
}

export const PatchModel: Model<IPatch> =
	mongoose.models.Patch || model<IPatch>('Patch', patchSchema);
