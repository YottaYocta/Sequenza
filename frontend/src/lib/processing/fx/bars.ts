import {
  type Behavior,
  type NumericalField,
  assertBehavior,
  newNumericalField,
} from "../Behavior";
import { type Output, outputToImageData } from "../Output";
import type { SvgOutput } from "../Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../ProcessingUnit";
import { cloneBehavior } from "../Behavior";

interface BarBehavior extends Behavior {
  type: "bars";
  fields: {
    direction: NumericalField; // 0 = horizontal, 1 = vertical
    numberBars: NumericalField;
    barSize: NumericalField;
    borderRadius: NumericalField;
    filterLow: NumericalField;
    filterHigh: NumericalField;
  };
}

export const createNewBarBehavior = (
  direction: "horizontal" | "vertical" = "horizontal",
  numberBars = 10,
  barSize = 5,
  borderRadius = 0,
  filterLow = 0,
  filterHigh = 1
): BarBehavior => {
  return {
    type: "bars",
    fields: {
      direction: newNumericalField(0, 1, direction === "horizontal" ? 0 : 1, 1),
      numberBars: newNumericalField(1, 100, numberBars, 1),
      barSize: newNumericalField(1, 100, barSize, 1),
      borderRadius: newNumericalField(0, 1, borderRadius, 0.01),
      filterLow: newNumericalField(0, 1, filterLow, 0.01),
      filterHigh: newNumericalField(0, 1, filterHigh, 0.01),
    },
  };
};

/**
 * Helper function to find the most frequently occurring color in a region
 */
const getMostFrequentColor = (
  data: Uint8ClampedArray,
  indices: number[]
): [number, number, number, number] => {
  const colorMap = new Map<
    string,
    { count: number; rgba: [number, number, number, number] }
  >();

  for (const index of indices) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    // Use rounded values to group similar colors
    const key = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${
      Math.round(b / 10) * 10
    }`;

    if (colorMap.has(key)) {
      const entry = colorMap.get(key)!;
      entry.count++;
    } else {
      colorMap.set(key, { count: 1, rgba: [r, g, b, a] });
    }
  }

  // Find the most frequent color
  let maxCount = 0;
  let mostFrequent: [number, number, number, number] = [0, 0, 0, 255];

  for (const entry of colorMap.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      mostFrequent = entry.rgba;
    }
  }

  return mostFrequent;
};

/**
 * Create a bar shape (rectangle with optional rounded corners)
 */
const createBarShape = (
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number
): string => {
  const clampedRadius = Math.max(0, Math.min(1, borderRadius));
  const actualRadius = Math.min(width, height) * clampedRadius * 0.5;

  if (clampedRadius > 0) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${actualRadius}" />`;
  } else {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" />`;
  }
};

const BarStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "bars");

  // Convert input to ImageData
  const inputImageData = await outputToImageData(input);

  // Deep clone the behavior
  const behaviorSnapshot = cloneBehavior(behavior) as BarBehavior;

  // Extract parameters
  const isHorizontal = behaviorSnapshot.fields.direction.default === 0;
  const numberBars = Math.floor(behaviorSnapshot.fields.numberBars.default);
  const barSize = behaviorSnapshot.fields.barSize.default;
  const borderRadius = behaviorSnapshot.fields.borderRadius.default;
  const filterLow = behaviorSnapshot.fields.filterLow.default;
  const filterHigh = behaviorSnapshot.fields.filterHigh.default;

  // Create output SVG
  const outputSvg: SvgOutput = {
    viewBox: {
      x: 0,
      y: 0,
      width: inputImageData.width,
      height: inputImageData.height,
    },
    children: [],
  };

  const width = inputImageData.width;
  const height = inputImageData.height;
  const data = inputImageData.data;

  let currentBar = 0;

  // Return the step function closure
  return (): [number, Output] => {
    if (currentBar >= numberBars) {
      // All bars processed, return final output
      return [1, { type: "svg", data: outputSvg }];
    }

    let barSVG = "";

    if (isHorizontal) {
      // Horizontal bars - process one row of bars at a time
      const barHeight = height / numberBars;
      const startY = Math.floor(currentBar * barHeight);
      const endY = Math.floor((currentBar + 1) * barHeight);

      // Collect all pixel indices in this bar region
      const indices: number[] = [];
      for (let y = startY; y < endY && y < height; y++) {
        for (let x = 0; x < width; x++) {
          indices.push((y * width + x) * 4);
        }
      }

      // Get the most frequent color in this region
      const [r, g, b, a] = getMostFrequentColor(data, indices);

      // Calculate brightness for filtering
      const brightness = (r + g + b) / (3 * 255);

      // Apply midpass filter
      const clampedLow = Math.max(0, Math.min(1, filterLow));
      const clampedHigh = Math.max(0, Math.min(1, filterHigh));

      if (brightness >= clampedLow && brightness <= clampedHigh) {
        // Draw horizontal bar centered in the region
        const centerY = (startY + endY) / 2;
        const barY = centerY - barSize / 2;

        const barShape = createBarShape(0, barY, width, barSize, borderRadius);
        barSVG = barShape.replace(
          "<rect",
          `<rect fill="rgba(${r}, ${g}, ${b}, ${a / 255})"`
        );
      }
    } else {
      // Vertical bars - process one column of bars at a time
      const barWidth = width / numberBars;
      const startX = Math.floor(currentBar * barWidth);
      const endX = Math.floor((currentBar + 1) * barWidth);

      // Collect all pixel indices in this bar region
      const indices: number[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = startX; x < endX && x < width; x++) {
          indices.push((y * width + x) * 4);
        }
      }

      // Get the most frequent color in this region
      const [r, g, b, a] = getMostFrequentColor(data, indices);

      // Calculate brightness for filtering
      const brightness = (r + g + b) / (3 * 255);

      // Apply midpass filter
      const clampedLow = Math.max(0, Math.min(1, filterLow));
      const clampedHigh = Math.max(0, Math.min(1, filterHigh));

      if (brightness >= clampedLow && brightness <= clampedHigh) {
        // Draw vertical bar centered in the region
        const centerX = (startX + endX) / 2;
        const barX = centerX - barSize / 2;

        const barShape = createBarShape(barX, 0, barSize, height, borderRadius);
        barSVG = barShape.replace(
          "<rect",
          `<rect fill="rgba(${r}, ${g}, ${b}, ${a / 255})"`
        );
      }
    }

    // Append this bar to the SVG children array
    if (barSVG.length > 0) {
      outputSvg.children.push(barSVG);
    }

    currentBar++;
    const progress = currentBar / numberBars;

    return [progress, { type: "svg", data: outputSvg }];
  };
};

GlobalStepFunctionFactoryRegistry.set("bar", BarStepFunctionFactory);
