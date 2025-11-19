import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
  newSelectionField,
  type Behavior,
  type NumericalField,
  type SelectionField,
  type SwitchField,
} from "../../core/Behavior";
import { outputToImageData, type Output } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import {
  getGLContext,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../core/util";
import fragmentShaderSource from "./scale.frag?raw";

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
  assertBehavior(behavior, "scale");
  const behaviorSnapshot = cloneBehavior(behavior) as ScaleBehavior;
  const inputImageData = await outputToImageData(input);

  const currentMode = behaviorSnapshot.fields.mode.currentField;
  const uniformScaleValue =
    behaviorSnapshot.fields.mode.switchFields.uniform.factor.value;
  const freeformWidth =
    behaviorSnapshot.fields.mode.switchFields.freeform.width.value;
  const freeformHeight =
    behaviorSnapshot.fields.mode.switchFields.freeform.height.value;

  const outputImageData =
    currentMode === "uniform"
      ? new ImageData(
          inputImageData.width * uniformScaleValue,
          inputImageData.height * uniformScaleValue
        )
      : new ImageData(freeformWidth, freeformHeight);

  const [canvas, gl] = getGLContext(
    outputImageData.width,
    outputImageData.height
  );

  if (gl !== null) {
    const stepFunction: StepFunction = () => {
      const processStep = () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.finish();
        gl.readPixels(
          0,
          0,
          outputImageData.width,
          outputImageData.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          outputImageData.data
        );
      };

      runWithGLContext(
        gl,
        STANDARD_VERTEX_SHADER,
        fragmentShaderSource,
        inputImageData,
        processStep
      );

      return [1, input];
    };

    return stepFunction;
  }

  throw new Error("CPU rendering not implemented!");
};

GlobalStepFunctionFactoryRegistry.set(
  "scale",
  ScaleBehaviorStepFunctionFactory
);
