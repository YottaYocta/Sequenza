import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
  type Behavior,
  type ColorField,
  type NumericalField,
} from "../../core/Behavior";
import { outputToImageData, type Output } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import {
  hexToRGBA,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../core/util";

import chromaFragShader from "./chromakey.frag?raw";

interface ChromaKeyBehavior extends Behavior {
  type: "chromakey";
  fields: {
    sourceColor: ColorField;
    targetColor: ColorField;
    threshold: NumericalField;
  };
}

export const createChromaKeyBehavior = (
  sourceColor = "#ffffffff",
  targetColor = "#ffffffff"
): ChromaKeyBehavior => {
  return {
    type: "chromakey",
    fields: {
      sourceColor: {
        type: "ColorField",
        value: sourceColor,
      },
      targetColor: {
        type: "ColorField",
        value: targetColor,
      },
      threshold: newNumericalField(0, 1, 0.01, 0.001, 0.01),
    },
  };
};

const ChromaKeyStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "chromakey");
  const behaviorSnapshot = cloneBehavior(behavior) as ChromaKeyBehavior;

  const chromaKeyBehavior = cloneBehavior<ChromaKeyBehavior>(
    behavior as ChromaKeyBehavior
  );

  const inputImage = await outputToImageData(input);
  const outputImage = new ImageData(inputImage.width, inputImage.height);

  // webgl rendering

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = inputImage.width;
  canvas.height = inputImage.height;

  const stepFunction: StepFunction = () => {
    const gl = canvas.getContext("webgl");
    if (gl != null) {
      const fragSource = chromaFragShader;

      runWithGLContext(
        gl,
        STANDARD_VERTEX_SHADER,
        fragSource,
        inputImage,
        (program) => {
          const sourceColorLocation = gl.getUniformLocation(
            program,
            "u_sourceColor"
          );
          const [sr, sg, sb] = hexToRGBA(
            chromaKeyBehavior.fields.sourceColor.value
          );
          gl.uniform3f(sourceColorLocation, sr / 255, sg / 255, sb / 255);

          const targetColorLocation = gl.getUniformLocation(
            program,
            "u_targetColor"
          );
          const [tr, tg, tb, ta] = hexToRGBA(
            chromaKeyBehavior.fields.targetColor.value
          );
          gl.uniform4f(
            targetColorLocation,
            tr / 255,
            tg / 255,
            tb / 255,
            ta / 255
          );

          const thresholdLocation = gl.getUniformLocation(
            program,
            "u_threshold"
          );
          gl.uniform1f(
            thresholdLocation,
            chromaKeyBehavior.fields.threshold.value
          );

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
            outputImage.data
          );
        }
      );
    }
    return [1, { type: "image", data: outputImage }];
  };

  return stepFunction;
};

GlobalStepFunctionFactoryRegistry.set(
  "chromakey",
  ChromaKeyStepFunctionFactory
);
