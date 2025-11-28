import type { Behavior } from './Behavior';
import type { Output } from './Output';
import type { Patch } from './Patch';
import {
	newProcessingTask,
	newProcessingUnit,
	type ProcessingTask,
	type ProcessingUnit
} from './ProcessingUnit';

export interface EditorState {
	source: Output | null;
	processingUnits: ProcessingUnit[]; // list of nodes in execution order
	currentTask: ProcessingTask | null;
}

export const serializeEditorState = (state: EditorState, name: string = 'Untitled Patch'): Patch => {
	return {
		name,
		behaviors: state.processingUnits.map(unit => unit.behavior)
	};
};

/**
 * Loads a patch into the editor state
 * @param state EditorState to load the patch into
 * @param patch Patch to load
 */
export const loadPatchIntoState = async (state: EditorState, patch: Patch): Promise<void> => {
	// Clear existing processing units
	state.processingUnits = [];

	// Add each behavior from the patch
	for (const behavior of patch.behaviors) {
		await pushUnit(state, behavior);
	}
};

export const newEditorState = (source: Output): EditorState => {
	return {
		source,
		processingUnits: [],
		currentTask: null
	};
};

export const setSource = async (state: EditorState, source: Output) => {
	state.source = source;
	// Reset all units
	for (let i = 0; i < state.processingUnits.length; i++) {
		state.processingUnits[i].progress = 0;
	}
	await pollUnprocessedUnits(state);
};

export const pushUnit = async (state: EditorState, newBehavior: Behavior) => {
	state.processingUnits.push(newProcessingUnit(newBehavior));
	await pollUnprocessedUnits(state);
};

export const removeUnitAt = async (state: EditorState, index: number): Promise<ProcessingUnit> => {
	if (index >= 0 && index < state.processingUnits.length) {
		const removed = state.processingUnits.splice(index, 1)[0];
		await pollUnprocessedUnits(state);
		return removed;
	} else {
		throw new Error(`tried to remove behavior at invalid index ${index}`);
	}
};

export const pollUnprocessedUnits = async (state: EditorState) => {
	const firstUncompletedIndex = state.processingUnits.findIndex(
		(unit) => unit.progress < 1 || unit.cachedOutput === null
	);
	if (firstUncompletedIndex > 0) {
		const previousSource = state.processingUnits[firstUncompletedIndex - 1].cachedOutput as Output;
		const newTask = await newProcessingTask(
			previousSource,
			state.processingUnits[firstUncompletedIndex].behavior,
			firstUncompletedIndex
		);
		state.currentTask = newTask;
	} else if (firstUncompletedIndex === 0 && state.source !== null) {
		const newTask = await newProcessingTask(
			state.source,
			state.processingUnits[firstUncompletedIndex].behavior,
			firstUncompletedIndex
		);
		state.currentTask = newTask;
	} else {
		state.currentTask = null;
	}
};

export const updateBehaviorAt = async (
	state: EditorState,
	index: number,
	newBehavior: Behavior
): Promise<void> => {
	if (index >= 0 && index < state.processingUnits.length) {
		state.processingUnits[index].behavior = newBehavior;
		for (let i = index; i < state.processingUnits.length; i++) {
			state.processingUnits[i].progress = 0;
		}
		await pollUnprocessedUnits(state);
	} else throw new Error(`tried to update behavior at invalid index ${index}`);
};

/**
 *
 * @param state state to process a step for
 * @returns true if processing finished, false otherwise
 */
export const processTaskStep = (state: EditorState): boolean => {
	if (state.currentTask !== null) {
		const [progress, output] = state.currentTask.stepFunction();
		state.processingUnits[state.currentTask.unitIndex].progress = progress;
		state.processingUnits[state.currentTask.unitIndex].cachedOutput = output;
		if (progress >= 1) {
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
};
