import type { Behavior } from "./Behavior";
import type { Output } from "./Output";
import {
  newProcessingTask,
  type ProcessingTask,
  type ProcessingUnit,
} from "./ProcessingUnit";

interface EditorState {
  source: Output;
  processingUnits: ProcessingUnit[]; // list of nodes in execution order
  currentTask: ProcessingTask | null;
}

const syncProcessingTask = (state: EditorState) => {
  const firstUncompletedIndex = state.processingUnits.findIndex(
    (unit) => unit.progress < 1 || unit.cachedOutput === null
  );
  if (firstUncompletedIndex > 0) {
    const previousSource = state.processingUnits[firstUncompletedIndex - 1]
      .cachedOutput as Output;
    const newTask = newProcessingTask(
      previousSource,
      state.processingUnits[firstUncompletedIndex].behavior,
      firstUncompletedIndex
    );
    state.currentTask = newTask;
  } else if (firstUncompletedIndex === 0) {
    const newTask = newProcessingTask(
      state.source,
      state.processingUnits[firstUncompletedIndex].behavior,
      firstUncompletedIndex
    );
    state.currentTask = newTask;
  } else {
    state.currentTask = null;
  }
};

export const updateBehaviorAt = (
  state: EditorState,
  index: number,
  newBehavior: Behavior
): void => {
  if (index >= 0 && index < state.processingUnits.length) {
    state.processingUnits[index].behavior = newBehavior;
    for (let i = index; i < state.processingUnits.length; i++) {
      state.processingUnits[i].progress = 0;
    }
    syncProcessingTask(state);
  } else throw new Error(`tried to update behavior at invalid index ${index}`);
};

/**
 *
 * @param state state to process a step for
 * @returns true if finished, false otherwise
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
