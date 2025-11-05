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
import { cloneBehavior } from "../core/util";

interface AsciiBehavior extends Behavior {
  type: "ascii";
  fields: {
    charSize: NumericalField;
    resolutionMultiplier: NumericalField;
    filterLow: NumericalField;
    filterHigh: NumericalField;
  };
}

export const createNewAsciiBehavior = (
  charSize = 10,
  resolutionMultiplier = 2,
  filterLow = 0,
  filterHigh = 1
): AsciiBehavior => {
  return {
    type: "ascii",
    fields: {
      charSize: newNumericalField(4, 50, charSize, 1),
      resolutionMultiplier: newNumericalField(1, 4, resolutionMultiplier, 1),
      filterLow: newNumericalField(0, 1, filterLow, 0.01),
      filterHigh: newNumericalField(0, 1, filterHigh, 0.01),
    },
  };
};

// ASCII character set ordered by density (from darkest to lightest)
const ASCII_CHARS = " .:-=+*#%@";

/**
 * Map brightness (0-1) to an ASCII character
 */
const brightnessToChar = (brightness: number): string => {
  const index = Math.floor(brightness * (ASCII_CHARS.length - 1));
  return ASCII_CHARS[ASCII_CHARS.length - 1 - index]; // Reverse for correct mapping
};

const AsciiStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  // Assert behavior is ascii type
  if (behavior.type !== "ascii") {
    throw new Error(
      `Ascii factory requires behavior type "ascii", got "${behavior.type}"`
    );
  }

  // Convert input to ImageData
  const inputImageData = await outputToImageData(input);

  // Deep clone the behavior
  const behaviorSnapshot = cloneBehavior(behavior) as AsciiBehavior;

  // Extract parameters
  const charSize = Math.floor(behaviorSnapshot.fields.charSize.default);
  const resolutionMultiplier = Math.floor(
    behaviorSnapshot.fields.resolutionMultiplier.default
  );
  const filterLow = behaviorSnapshot.fields.filterLow.default;
  const filterHigh = behaviorSnapshot.fields.filterHigh.default;

  const width = inputImageData.width;
  const height = inputImageData.height;
  const sourceData = inputImageData.data;

  // Calculate number of rows and columns based on charSize
  const cols = Math.floor(width / charSize);
  const rows = Math.floor(height / charSize);

  // Calculate output dimensions with resolution multiplier
  const outputWidth = width * resolutionMultiplier;
  const outputHeight = height * resolutionMultiplier;
  const scaledCharSize = charSize * resolutionMultiplier;

  // Create a canvas to render text at higher resolution
  const canvas = new OffscreenCanvas(outputWidth, outputHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context from OffscreenCanvas");
  }

  // Set up text rendering
  ctx.font = `${scaledCharSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, outputWidth, outputHeight);

  let currentRow = 0;

  // Return the step function closure
  return (): [number, Output] => {
    if (currentRow >= rows) {
      // All rows processed, return final output
      const outputImageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
      return [1, { type: "image", data: outputImageData }];
    }

    // Process current row of characters
    for (let col = 0; col < cols; col++) {
      // Calculate the center pixel of this character cell in source dimensions
      const centerX = Math.floor(col * charSize + charSize / 2);
      const centerY = Math.floor(currentRow * charSize + charSize / 2);

      // Ensure we're within image bounds
      if (centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) {
        continue;
      }

      // Sample the pixel at the center of the cell
      const index = (centerY * width + centerX) * 4;
      const r = sourceData[index];
      const g = sourceData[index + 1];
      const b = sourceData[index + 2];
      const a = sourceData[index + 3] / 255;

      // Calculate brightness for filtering and character selection
      const brightness = (r + g + b) / (3 * 255);

      // Apply midpass filter - skip characters outside the value range
      const clampedLow = Math.max(0, Math.min(1, filterLow));
      const clampedHigh = Math.max(0, Math.min(1, filterHigh));
      if (brightness < clampedLow || brightness > clampedHigh) {
        continue;
      }

      // Select ASCII character based on brightness
      const char = brightnessToChar(brightness);

      // Draw the character with the sampled color at scaled position
      const scaledCenterX = centerX * resolutionMultiplier;
      const scaledCenterY = centerY * resolutionMultiplier;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillText(char, scaledCenterX, scaledCenterY);
    }

    currentRow++;
    const progress = currentRow / rows;

    // Return intermediate output with current canvas state
    const currentImageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
    return [progress, { type: "image", data: currentImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set("ascii", AsciiStepFunctionFactory);
