import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
  newSelectionField,
  throwStepFunctionFactoryError,
  type Behavior,
  type NumericalField,
  type SelectionField,
  type SwitchField,
} from "../../core/Behavior";
import type { Output } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";

interface ScaleSelectionField extends SelectionField {
  value: "crisp" | "smooth";
  options: ["crisp", "smooth"];
}

interface ScaleModeField extends SwitchField {
  currentField: "uniform" | "freeform";
  switchFields: {
    uniform: {
      factor: NumericalField;
    };
    freeform: {
      width: NumericalField;
      height: NumericalField;
    };
  };
}

interface ScaleBehavior extends Behavior {
  type: "scale";
  fields: {
    interpolation: ScaleSelectionField;
    mode: ScaleModeField;
  };
}

export const newScaleBehavior = (): ScaleBehavior => {
  return {
    type: "scale",
    fields: {
      interpolation: newSelectionField(
        ["crisp", "smooth"],
        "crisp"
      ) as ScaleSelectionField,
      mode: {
        type: "SwitchField",
        currentField: "uniform",
        switchFields: {
          uniform: {
            factor: newNumericalField(0.5, 5, 1, 0.2, 1),
          },
          freeform: {
            width: newNumericalField(1, 4096, 512, 1, 512),
            height: newNumericalField(1, 4096, 512, 1, 512),
          },
        },
      },
    },
  };
};

const ScaleBehaviorStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  const behaviorSnapshot = cloneBehavior(behavior);
  if (assertBehavior<ScaleBehavior>(behaviorSnapshot, "scale")) {
    throwStepFunctionFactoryError("scale", behavior.type);
  }

  const stepFunction: StepFunction = () => {
    return [1, input];
  };

  return stepFunction;
};

GlobalStepFunctionFactoryRegistry.set(
  "scale",
  ScaleBehaviorStepFunctionFactory
);
