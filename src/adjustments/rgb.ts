import {
  type Behavior,
  type NumericalField,
  newNumericalField,
} from "../core/Behavior";
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
  let inputImageData: ImageData;

  if (input.type === "image") {
    inputImageData = input.data;
  } else {
    // SVG type - render to offline canvas
    const svg = input.data;
    const canvas = new OffscreenCanvas(svg.viewBox.width, svg.viewBox.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from OffscreenCanvas");
    }

    // Create SVG blob and render it
    const svgString = `<svg viewBox="${svg.viewBox.x} ${svg.viewBox.y} ${svg.viewBox.width} ${svg.viewBox.height}" xmlns="http://www.w3.org/2000/svg">${svg.children.join("")}</svg>`;
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    // Load and draw the SVG
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };
      img.src = url;
    });

    inputImageData = ctx.getImageData(0, 0, svg.viewBox.width, svg.viewBox.height);
  }

  // Deep clone the behavior
  const behaviorSnapshot = structuredClone(behavior) as RGBBehavior;

  // Create output ImageData
  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  // Extract RGB adjustment values
  const rAdjust = behaviorSnapshot.fields.r.default;
  const gAdjust = behaviorSnapshot.fields.g.default;
  const bAdjust = behaviorSnapshot.fields.b.default;

  // Define chunk size (e.g., 64x64 squares)
  const chunkSize = 64;
  const width = inputImageData.width;
  const height = inputImageData.height;

  // Precompute list of chunks
  interface Chunk {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }

  const chunks: Chunk[] = [];
  for (let y = 0; y < height; y += chunkSize) {
    for (let x = 0; x < width; x += chunkSize) {
      chunks.push({
        startX: x,
        startY: y,
        endX: Math.min(x + chunkSize, width),
        endY: Math.min(y + chunkSize, height),
      });
    }
  }

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
