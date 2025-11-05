import type { Behavior } from "./Behavior";
import type { Output } from "./Output";

export interface ProcessingUnit {
  behavior: Behavior;
  cachedOutput: Output | null;
  progress: number;
}

export const newProcessingUnit = (behavior: Behavior): ProcessingUnit => {
  return {
    behavior: structuredClone(behavior),
    cachedOutput: null,
    progress: 0,
  };
};

type StepFunction = () => [number, Output]; // progress and the output

export interface ProcessingTask {
  unitIndex: number;
  stepFunction: StepFunction;
}

export type StepFunctionFactory = (
  input: Output,
  behavior: Behavior
) => StepFunction;

export const GlobalStepFunctionFactoryRegistry: Map<
  string,
  StepFunctionFactory
> = new Map<string, StepFunctionFactory>();

export const newProcessingTask = (
  input: Output,
  behavior: Behavior,
  unitIndex: number
): ProcessingTask => {
  const createStepFunction = GlobalStepFunctionFactoryRegistry.get(
    behavior.type
  );
  if (createStepFunction === undefined) {
    throw new Error(
      `step function factory for '${behavior.type}' does not exist`
    );
  } else {
    const stepFunction = createStepFunction(input, structuredClone(behavior));
    return {
      unitIndex,
      stepFunction,
    };
  }
};
