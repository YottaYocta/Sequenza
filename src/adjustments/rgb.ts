import type { Behavior, NumericalField } from "../core/Behavior";
import type { Output } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";

interface RGBBehavior extends Behavior {
  type: "rgb";
  fields: {
    r: NumericalField;
    g: NumericalField;
    b: NumericalField;
  };
}

const createNewRGBBehavior = (r = 0, g = 0, b = 0): RGBBehavior => {
  throw new Error("Not Implemented");
};

const RGBStepFunctionFactory: StepFunctionFactory = (
  input: Output,
  behavior: Behavior
): StepFunction => {
  throw new Error("Not Implemented");
};

GlobalStepFunctionFactoryRegistry.set("rgb", RGBStepFunctionFactory);
