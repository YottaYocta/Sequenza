import type {
  Behavior,
  ColorField,
  NumericalField,
  SwitchField,
} from "../../core/Behavior";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";

interface LinesSwitchBehavior extends SwitchField {
  switchFields: {
    dynamicColor: {}; // sampling color at each pixel
    singleColor: {
      color: ColorField;
    };
  };
}

interface LinesBehavior extends Behavior {
  type: "lines";
  fields: {
    rotation: NumericalField;
    density: NumericalField; // higher density = more lines
    colorMode: LinesSwitchBehavior;
  };
}

export const createLinesBehavior = (): LinesBehavior => {
  throw Error("todo");
};

const linesBehaviorStepFunctionFactory: StepFunctionFactory = (
  input,
  behavior
) => {
  throw new Error("todo");
};

GlobalStepFunctionFactoryRegistry.set(
  "lines",
  linesBehaviorStepFunctionFactory
);
