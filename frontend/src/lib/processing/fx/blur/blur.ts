import type {
  Behavior,
  NumericalField,
  SwitchField,
} from "../../Behavior";
import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
} from "../../Behavior";
import { outputToImageData, type Output } from "../../Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../ProcessingUnit";
import { runWithGLContext, STANDARD_VERTEX_SHADER } from "../../util";
import gaussianFragSource from "./gaussian.frag?raw";
import linearFragSource from "./linear.frag?raw";

interface BlurSwitchBehavior extends SwitchField {
  currentField: "gaussian" | "linear";
  switchFields: {
    gaussian: {
      size: NumericalField;
    };
    linear: {
      size: NumericalField;
    };
  };
}

interface BlurBehavior extends Behavior {
  type: "blur";
  fields: {
    blurType: BlurSwitchBehavior;
  };
}

export const createBlurBehavior = (): BlurBehavior => {
  return {
    type: "blur",
    fields: {
      blurType: {
        type: "SwitchField",
        currentField: "gaussian",
        switchFields: {
          gaussian: {
            size: newNumericalField(1, 50, 5, 1, 5),
          },
          linear: {
            size: newNumericalField(1, 50, 5, 1, 5),
          },
        },
      },
    },
  };
};

const blurBehaviorStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "blur");
  const behaviorSnapshot = cloneBehavior(behavior) as BlurBehavior;

  const inputImageData = await outputToImageData(input);

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const blurType = behaviorSnapshot.fields.blurType.currentField;
  const size =
    blurType === "gaussian"
      ? behaviorSnapshot.fields.blurType.switchFields.gaussian.size.value
      : behaviorSnapshot.fields.blurType.switchFields.linear.size.value;

  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    const fragSource =
      blurType === "gaussian" ? gaussianFragSource : linearFragSource;

    const processStep = (program: WebGLProgram) => {
      const sizeLocation = gl.getUniformLocation(program, "u_size");
      gl.uniform1f(sizeLocation, size);

      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      const textureLocation = gl.getUniformLocation(program, "u_texture");
      gl.uniform1i(textureLocation, 0);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
      gl.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        outputImageData.data
      );
    };

    runWithGLContext(
      gl,
      STANDARD_VERTEX_SHADER,
      fragSource,
      inputImageData,
      processStep
    );

    return (): [number, Output] => {
      return [1, { type: "image", data: outputImageData }];
    };
  }

  outputImageData.data.set(new Uint8ClampedArray(inputImageData.data));
  return (): [number, Output] => {
    return [1, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set("blur", blurBehaviorStepFunctionFactory);
