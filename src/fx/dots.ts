import {
  type Behavior,
  type NumericalField,
  assertBehavior,
  newNumericalField,
} from "../core/Behavior";
import { type Output, outputToImageData } from "../core/Output";
import type { SvgOutput } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";
import { cloneBehavior } from "../core/Behavior";
import { perceptualLuminance } from "../core/util";

interface DotBehavior extends Behavior {
  type: "dots";
  fields: {
    horizontalCount: NumericalField;
    verticalCount: NumericalField;
    dotRadius: NumericalField;
    borderRadius: NumericalField;
    rotation: NumericalField;
    filterLow: NumericalField;
    filterHigh: NumericalField;
  };
}

export const createNewDotBehavior = (
  horizontalCount = 10,
  verticalCount = 10,
  dotRadius = 5,
  borderRadius = 1,
  rotation = 0,
  filterLow = 0,
  filterHigh = 1
): DotBehavior => {
  return {
    type: "dots",
    fields: {
      horizontalCount: newNumericalField(1, 100, horizontalCount, 1),
      verticalCount: newNumericalField(1, 100, verticalCount, 1),
      dotRadius: newNumericalField(1, 50, dotRadius, 1),
      borderRadius: newNumericalField(-1, 1, borderRadius, 0.01),
      rotation: newNumericalField(0, 360, rotation, 1),
      filterLow: newNumericalField(0, 1, filterLow, 0.01),
      filterHigh: newNumericalField(0, 1, filterHigh, 0.01),
    },
  };
};

/**
 * Create a dot shape (circle, square, or star depending on borderRadius)
 */
const createDotShape = (
  x: number,
  y: number,
  size: number,
  borderRadius: number,
  rotation: number
): string => {
  const group = `<g transform="translate(${x}, ${y}) rotate(${rotation})">`;
  let shape = "";

  if (borderRadius >= 0.99) {
    // Fully rounded - circle
    shape = `<circle r="${size}" />`;
  } else if (borderRadius <= -0.99) {
    // Star shape (concave circle)
    const path = createStarPath(size);
    shape = `<path d="${path}" />`;
  } else if (borderRadius > 0) {
    // Rounded rectangle
    const rectSize = size * 2;
    shape = `<rect x="${-size}" y="${-size}" width="${rectSize}" height="${rectSize}" rx="${
      size * borderRadius
    }" />`;
  } else {
    // Square (borderRadius = 0)
    const rectSize = size * 2;
    shape = `<rect x="${-size}" y="${-size}" width="${rectSize}" height="${rectSize}" />`;
  }

  return group + shape + "</g>";
};

/**
 * Create a 4-pointed star path
 */
const createStarPath = (size: number): string => {
  const points = 4;
  const outerRadius = size;
  const innerRadius = size * 0.5;
  let path = "";

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    path += `${i === 0 ? "M" : "L"} ${x} ${y} `;
  }
  path += "Z";
  return path;
};

const DotStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "dots");
  const inputImageData = await outputToImageData(input);

  const behaviorSnapshot = cloneBehavior(behavior) as DotBehavior;

  const horizontalCount = Math.floor(
    behaviorSnapshot.fields.horizontalCount.value
  );
  const verticalCount = Math.floor(behaviorSnapshot.fields.verticalCount.value);
  const dotRadius = behaviorSnapshot.fields.dotRadius.value;
  const borderRadius = behaviorSnapshot.fields.borderRadius.value;
  const rotation = behaviorSnapshot.fields.rotation.value;
  const filterLow = behaviorSnapshot.fields.filterLow.value;
  const filterHigh = behaviorSnapshot.fields.filterHigh.value;

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

  // Calculate cell dimensions
  const cellWidth = width / horizontalCount;
  const cellHeight = height / verticalCount;

  let currentRow = 0;

  return (): [number, Output] => {
    if (currentRow >= verticalCount) {
      // All rows processed, return final output
      return [1, { type: "svg", data: outputSvg }];
    }

    let rowSVG = "";

    for (let col = 0; col < horizontalCount; col++) {
      // Calculate the center pixel of this grid cell
      const centerX = Math.floor(col * cellWidth + cellWidth / 2);
      const centerY = Math.floor(currentRow * cellHeight + cellHeight / 2);

      if (centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) {
        continue;
      }

      // Sample the pixel at the center of the cell
      const index = (centerY * width + centerX) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3] / 255;

      const brightness = perceptualLuminance(r, g, b);

      // Apply midpass filter - skip pixels outside the value range
      const clampedLow = Math.max(0, Math.min(1, filterLow));
      const clampedHigh = Math.max(0, Math.min(1, filterHigh));
      if (brightness < clampedLow || brightness > clampedHigh) {
        continue;
      }

      // Create dot with sampled color
      const dotShape = createDotShape(
        centerX,
        centerY,
        dotRadius,
        borderRadius,
        rotation
      );
      // Insert fill attribute into the group tag
      const dotWithColor = dotShape.replace(
        "<g",
        `<g fill="rgba(${r}, ${g}, ${b}, ${a})"`
      );
      rowSVG += dotWithColor;
    }

    // Append this row's dots to the SVG children array
    if (rowSVG.length > 0) {
      outputSvg.children.push(rowSVG);
    }

    currentRow++;
    const progress = currentRow / verticalCount;

    return [progress, { type: "svg", data: outputSvg }];
  };
};

GlobalStepFunctionFactoryRegistry.set("dot", DotStepFunctionFactory);
