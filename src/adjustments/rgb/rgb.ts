import {
  type Behavior,
  type NumericalField,
  assertBehavior,
  newNumericalField,
} from "../../core/Behavior";
import { type Output, outputToImageData } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import {
  generateChunks,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../core/util";
import { cloneBehavior } from "../../core/Behavior";
import rgbFragSource from "./rgb.frag?raw";

interface RGBBehavior extends Behavior {
  type: "rgb";
  fields: {
    r: NumericalField;
    g: NumericalField;
    b: NumericalField;
  };
}

export const createNewRGBBehavior = (r = 0, g = 0, b = 0): RGBBehavior => {
  return {
    type: "rgb",
    fields: {
      r: newNumericalField(-255, 255, r, 1),
      g: newNumericalField(-255, 255, g, 1),
      b: newNumericalField(-255, 255, b, 1),
    },
  };
};

const RGBStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "rgb");
  const behaviorSnapshot = cloneBehavior(behavior) as RGBBehavior;

  const inputImageData = await outputToImageData(input);

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const rAdjust = behaviorSnapshot.fields.r.value;
  const gAdjust = behaviorSnapshot.fields.g.value;
  const bAdjust = behaviorSnapshot.fields.b.value;

  // Try WebGL rendering
  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    const fragmentShaderSource = rgbFragSource;

    const processStep = (program: WebGLProgram) => {
      const rgbAdjustLocation = gl.getUniformLocation(program, "u_rgbAdjust");
      gl.uniform3f(rgbAdjustLocation, rAdjust, gAdjust, bAdjust);

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
      fragmentShaderSource,
      inputImageData,
      processStep
    );

    return (): [number, Output] => {
      return [1, { type: "image", data: outputImageData }];
    };
  }

  // CPU fallback path
  // Define chunk size (e.g., 64x64 squares)
  const chunkSize = 64;
  const width = inputImageData.width;

  // Precompute list of chunks
  const chunks = generateChunks(inputImageData, chunkSize, chunkSize);
  const totalChunks = chunks.length;
  let currentChunkIndex = 0;

  // Return the step function closure
  return (): [number, Output] => {
    if (currentChunkIndex >= totalChunks) {
      // All chunks processed, return final output
      return [1, { type: "image", data: outputImageData }];
    }

    // Process current chunk
    const chunk = chunks[currentChunkIndex];
    const inputData = inputImageData.data;
    const outputData = outputImageData.data;

    for (let y = chunk.startY; y < chunk.endY; y++) {
      for (let x = chunk.startX; x < chunk.endX; x++) {
        const index = (y * width + x) * 4;

        // Apply RGB adjustments
        outputData[index] = Math.max(
          0,
          Math.min(255, inputData[index] + rAdjust)
        );
        outputData[index + 1] = Math.max(
          0,
          Math.min(255, inputData[index + 1] + gAdjust)
        );
        outputData[index + 2] = Math.max(
          0,
          Math.min(255, inputData[index + 2] + bAdjust)
        );
        outputData[index + 3] = inputData[index + 3]; // Alpha unchanged
      }
    }

    currentChunkIndex++;
    const progress = currentChunkIndex / totalChunks;

    return [progress, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set("rgb", RGBStepFunctionFactory);
