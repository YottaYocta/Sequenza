import {
  type Behavior,
  type NumericalField,
  newNumericalField,
} from "../core/Behavior";
import { type Output, outputToImageData } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";
import { generateChunks } from "../core/util";

interface RGBBehavior extends Behavior {
  type: "rgb";
  fields: {
    r: NumericalField;
    g: NumericalField;
    b: NumericalField;
  };
}

const createNewRGBBehavior = (r = 0, g = 0, b = 0): RGBBehavior => {
  return {
    type: "rgb",
    fields: {
      r: newNumericalField(0, 255, r, 1),
      g: newNumericalField(0, 255, g, 1),
      b: newNumericalField(0, 255, b, 1),
    },
  };
};

const RGBStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  // Convert input to ImageData
  const inputImageData = await outputToImageData(input);

  // Deep clone the behavior
  const behaviorSnapshot = structuredClone(behavior) as RGBBehavior;

  // Create output ImageData
  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  // Extract RGB adjustment values
  const rAdjust = behaviorSnapshot.fields.r.value;
  const gAdjust = behaviorSnapshot.fields.g.value;
  const bAdjust = behaviorSnapshot.fields.b.value;

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
