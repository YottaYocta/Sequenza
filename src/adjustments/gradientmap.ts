import {
  type Behavior,
  type GradientField,
  newGradient,
} from "../core/Behavior";
import { type Output, outputToImageData } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";
import { generateChunks } from "../core/util";
import { cloneBehavior } from "../core/Behavior";

interface GradientMapBehavior extends Behavior {
  type: "gradientmap";
  fields: {
    gradient: GradientField;
  };
}

export const createNewGradientMapBehavior = (
  stops: { position: number; color: string }[] = [
    { position: 0, color: "#000000" },
    { position: 1, color: "#ffffff" },
  ],
  easing: "Linear" | "Constant" = "Linear"
): GradientMapBehavior => {
  return {
    type: "gradientmap",
    fields: {
      gradient: newGradient(stops, easing),
    },
  };
};

/**
 * Helper function to parse hex color string to RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return [r, g, b];
};

/**
 * Helper function to convert RGB to hex string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Helper function to linearly interpolate between two colors
 */
const interpolateColors = (
  color1: string,
  color2: string,
  t: number
): string => {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;

  return rgbToHex(r, g, b);
};

/**
 * Evaluates the gradient at a given progress value (0-1)
 */
export const evalGradientAt = (
  gradient: GradientField,
  progress: number
): string => {
  const { stops, easing } = gradient;

  // Clamp progress to 0-1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Sort stops by position (in case they're not sorted)
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  // Handle edge cases
  if (sortedStops.length === 0) {
    return "#000000"; // Default to black if no stops
  }
  if (sortedStops.length === 1) {
    return sortedStops[0].color;
  }

  // If progress is before first stop
  if (clampedProgress <= sortedStops[0].position) {
    return sortedStops[0].color;
  }

  // If progress is after last stop
  if (clampedProgress >= sortedStops[sortedStops.length - 1].position) {
    return sortedStops[sortedStops.length - 1].color;
  }

  // Find the bracketing stops
  let lowerStop = sortedStops[0];
  let upperStop = sortedStops[sortedStops.length - 1];

  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (
      clampedProgress >= sortedStops[i].position &&
      clampedProgress <= sortedStops[i + 1].position
    ) {
      lowerStop = sortedStops[i];
      upperStop = sortedStops[i + 1];
      break;
    }
  }

  // Calculate local t value between the two stops
  const range = upperStop.position - lowerStop.position;
  const localT =
    range === 0 ? 0 : (clampedProgress - lowerStop.position) / range;

  // Apply interpolation type
  if (easing === "Constant") {
    // Constant interpolation: use the lower stop's color
    return lowerStop.color;
  } else {
    // Linear interpolation
    return interpolateColors(lowerStop.color, upperStop.color, localT);
  }
};

const GradientMapStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  // Assert behavior is gradient map type
  if (behavior.type !== "gradientmap") {
    throw new Error(
      `GradientMap factory requires behavior type "gradientmap", got "${behavior.type}"`
    );
  }

  // Convert input to ImageData
  const inputImageData = await outputToImageData(input);

  // Deep clone the behavior
  const behaviorSnapshot = cloneBehavior<GradientMapBehavior>(
    behavior as GradientMapBehavior
  );

  // Create output ImageData
  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  // Extract gradient
  const gradient = behaviorSnapshot.fields.gradient;

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

        // Get source pixel values
        const r = inputData[index];
        const g = inputData[index + 1];
        const b = inputData[index + 2];
        const a = inputData[index + 3];

        // Calculate brightness/luminance of the pixel (0-1)
        // Using relative luminance formula (perceived brightness)
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Get the gradient color at this brightness level
        const gradientColor = evalGradientAt(gradient, brightness);

        // Parse the gradient color
        const [newR, newG, newB] = hexToRgb(gradientColor);

        // Write the mapped color to output
        outputData[index] = newR;
        outputData[index + 1] = newG;
        outputData[index + 2] = newB;
        outputData[index + 3] = a; // Preserve alpha channel
      }
    }

    currentChunkIndex++;
    const progress = currentChunkIndex / totalChunks;

    return [progress, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set(
  "gradientmap",
  GradientMapStepFunctionFactory
);
