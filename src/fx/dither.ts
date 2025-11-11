import {
  newGradient,
  newNumericalField,
  newSelectionField,
  type Behavior,
  type GradientField,
  type NumericalField,
  type SelectionField,
  type SwitchField,
} from "../core/Behavior";
import { outputToImageData, type Output } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";
import {
  getRGBA,
  hexToRgb,
  inImageBounds,
  perceptualLuminance,
  setRGBA,
} from "../core/util";
import { cloneBehavior } from "../core/Behavior";
import { evalGradientAt } from "../adjustments/gradientmap";

interface BehaviorSwitchField extends SwitchField {
  currentField: "byNumColors" | "byGradient";
  switchFields: {
    byNumColors: { numColors: NumericalField };
    byGradient: { gradient: GradientField };
  };
}

export interface DitherBehavior extends Behavior {
  type: "dither";
  fields: {
    ditherType: SelectionField;
    ditherSize: NumericalField;
    colorMapping: BehaviorSwitchField;
  };
}

export const DITHER_OPTIONS = ["floyd-steinberg", "bayer"];

export const createDitherBehavior = (numColors = 2): DitherBehavior => {
  return {
    type: "dither",
    fields: {
      ditherType: newSelectionField(DITHER_OPTIONS, DITHER_OPTIONS[0]),
      ditherSize: newNumericalField(1, 16, 2, 1, 2),
      colorMapping: {
        type: "SwitchField",
        currentField: "byNumColors",
        switchFields: {
          byNumColors: {
            numColors: newNumericalField(2, 16, 2, 1, 2),
          },
          byGradient: {
            gradient: newGradient(
              [
                { position: 0, color: "#000000" },
                { position: 0.5, color: "#ffffff" },
              ],
              "Constant"
            ),
          },
        },
      },
    },
  };
};

export const DitherStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  const inputImageData = await outputToImageData(input);
  const { width, height } = inputImageData;
  const behaviorSnapshot = cloneBehavior(behavior) as DitherBehavior;
  const ditherSize = behaviorSnapshot.fields.ditherSize.value;
  const outputImageData = new ImageData(width, height);
  outputImageData.data.set(new Uint8ClampedArray(inputImageData.data));
  const output: Output = {
    type: "image",
    data: outputImageData,
  };

  let currentRow = 0;
  const pixelsPerStep = 10000;
  const rowStep = Math.floor(pixelsPerStep / width);

  const getNearestRGB = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    if (behaviorSnapshot.fields.colorMapping.currentField === "byGradient") {
      const currentGradient =
        behaviorSnapshot.fields.colorMapping.switchFields.byGradient.gradient;

      const currentBrightness = perceptualLuminance(r, g, b);
      const currentColor = evalGradientAt(currentGradient, currentBrightness);
      return hexToRgb(currentColor);
    } else {
      const numColors =
        behaviorSnapshot.fields.colorMapping.switchFields.byNumColors.numColors
          .value;
      const baseIncrement = 255 / Math.max(1, numColors - 1);
      const baseR = Math.round(r / baseIncrement) * baseIncrement;
      const baseG = Math.round(g / baseIncrement) * baseIncrement;
      const baseB = Math.round(b / baseIncrement) * baseIncrement;
      return [baseR, baseG, baseB];
    }
  };

  if (behaviorSnapshot.fields.ditherType.value === "floyd-steinberg") {
    const stepFunction: StepFunction = () => {
      const targetRow = currentRow + rowStep * ditherSize;
      for (
        ;
        currentRow < height && currentRow <= targetRow;
        currentRow += ditherSize
      ) {
        for (let x = 0; x < width; x += ditherSize) {
          const [r, g, b, a] = getRGBA(outputImageData, x, currentRow);
          const targetRGB = getNearestRGB(r, g, b);
          const targetRGBDifference = computeRGBDifference(
            [r, g, b],
            targetRGB
          );

          for (let i = 1; i <= 4; i++) {
            const xOffset = (((i + 1) % 3) - 1) * ditherSize;
            const yOffset = (i === 1 ? 0 : 1) * ditherSize;
            if (
              inImageBounds(outputImageData, x + xOffset, currentRow + yOffset)
            ) {
              const errorMultFactor =
                (i === 1 ? 7 : i === 2 ? 3 : i === 3 ? 5 : 1) / 16;
              const [rO, gO, bO, aO] = getRGBA(
                outputImageData,
                x + xOffset,
                currentRow + yOffset
              );
              setRGBA(outputImageData, x + xOffset, currentRow + yOffset, [
                targetRGBDifference[0] * errorMultFactor + rO,
                targetRGBDifference[1] * errorMultFactor + gO,
                targetRGBDifference[2] * errorMultFactor + bO,
                aO,
              ]);
            }
          }

          for (let i = 0; i < ditherSize && x + i < width; i++) {
            for (let j = 0; j < ditherSize && currentRow + j < height; j++) {
              setRGBA(outputImageData, x + i, currentRow + j, [
                targetRGB[0],
                targetRGB[1],
                targetRGB[2],
                a,
              ]);
            }
          }
        }
      }
      return [currentRow / height, output];
    };

    return stepFunction;
  } else {
    // Bayer matrix dithering using 8x8 matrix
    const bayerMatrix8x8 = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21],
    ];

    const stepFunction: StepFunction = () => {
      const targetRow = currentRow + rowStep * ditherSize;
      for (
        ;
        currentRow < height && currentRow <= targetRow;
        currentRow += ditherSize
      ) {
        for (let x = 0; x < width; x += ditherSize) {
          const [r, g, b, a] = getRGBA(outputImageData, x, currentRow);

          // Get Bayer threshold for this position (normalized to 0-1)
          const bayerX = Math.floor(x / ditherSize) % 8;
          const bayerY = Math.floor(currentRow / ditherSize) % 8;
          const threshold = (bayerMatrix8x8[bayerY][bayerX] + 0.5) / 64;

          // Apply threshold to create dithering effect
          const adjustedR = r + (threshold - 0.5) * 255;
          const adjustedG = g + (threshold - 0.5) * 255;
          const adjustedB = b + (threshold - 0.5) * 255;

          const targetRGB = getNearestRGB(adjustedR, adjustedG, adjustedB);

          // Apply the quantized color to the dither block
          for (let i = 0; i < ditherSize && x + i < width; i++) {
            for (let j = 0; j < ditherSize && currentRow + j < height; j++) {
              setRGBA(outputImageData, x + i, currentRow + j, [
                targetRGB[0],
                targetRGB[1],
                targetRGB[2],
                a,
              ]);
            }
          }
        }
      }
      return [currentRow / height, output];
    };

    return stepFunction;
  }
};

GlobalStepFunctionFactoryRegistry.set("dither", DitherStepFunctionFactory);

/**
 * computes differences in rgb
 * @param color1 first color
 * @param color2 second color
 * @returns [difference in R, difference in G, difference in B, total difference ]
 */
const computeRGBDifference = (
  color1: [number, number, number],
  color2: [number, number, number]
): [number, number, number] => {
  return [color1[0] - color2[0], color1[1] - color2[1], color1[2] - color2[2]];
};
