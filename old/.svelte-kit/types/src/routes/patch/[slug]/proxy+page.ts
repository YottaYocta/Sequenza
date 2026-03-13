// @ts-nocheck
import { deserializePatch, type Patch } from '$lib/processing/Patch';
import type { IPatch } from '$lib/server/models/PatchModel';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load = async ({ params, fetch }: Parameters<PageLoad>[0]) => {
	try {
		const res = await fetch(`/api/patch/${params.slug}`);
		const patchData: IPatch & { _id: string } = await res.json();
		const patch: Patch = deserializePatch(patchData.jsonData);

		return {
			patch,
			patchId: patchData._id,
			patchName: patchData.name,
			userId: patchData.userId,
			createdAt: patchData.createdAt,
			updatedAt: patchData.updatedAt
		};
	} catch (err) {
		console.error('Error loading patch: ', err);
		throw error(500, '"Failed to load patch data');
	}
};
