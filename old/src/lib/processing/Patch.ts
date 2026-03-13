import type { Behavior } from './Behavior';

export interface Patch {
	name: string;
	behaviors: Behavior[];
}

/**
 * Deserializes a JSON string into a Patch object
 * @param json JSON string representation of a Patch
 * @returns Patch object
 */
export const deserializePatch = (json: string): Patch => {
	const parsed = JSON.parse(json);

	if (!parsed.name || !Array.isArray(parsed.behaviors)) {
		throw new Error('Invalid patch format: missing name or behaviors array');
	}

	return {
		name: parsed.name,
		behaviors: parsed.behaviors
	};
};
