import {
  assertBehavior,
  newGradient,
  newNumericalField,
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
  hexToRGBA,
  inImageBounds,
  perceptualLuminance,
  setRGBA,
} from "../core/util";
import { cloneBehavior } from "../core/Behavior";
import { evalGradientAt } from "../adjustments/gradientmap/gradientmap";

interface BehaviorSwitchField extends SwitchField {
  currentField: "byNumColors" | "byGradient";
  switchFields: {
    byNumColors: { numColors: NumericalField };
    byGradient: { gradient: GradientField };
  };
}

interface DitherSelectionField extends SelectionField {
  type: "SelectionField";
  options: [
    "floyd-steinberg",
    "bayer16x16",
    "bayer8x8",
    "bayer4x4",
    "bayer2x2"
  ];
  value:
    | "floyd-steinberg"
    | "bayer16x16"
    | "bayer8x8"
    | "bayer4x4"
    | "bayer2x2";
}

export interface DitherBehavior extends Behavior {
  type: "dither";
  fields: {
    ditherType: DitherSelectionField;
    ditherSize: NumericalField;
    colorMapping: BehaviorSwitchField;
  };
}

export const DITHER_OPTIONS = ["floyd-steinberg", "bayer"];

export const createDitherBehavior = (): DitherBehavior => {
  return {
    type: "dither",
    fields: {
      ditherType: {
        type: "SelectionField",
        options: [
          "floyd-steinberg",
          "bayer16x16",
          "bayer8x8",
          "bayer4x4",
          "bayer2x2",
        ],
        value: "floyd-steinberg",
      },
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
  assertBehavior(behavior, "dither");

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

  const getNearestRGBA = (
    r: number,
    g: number,
    b: number,
    a = 255
  ): [number, number, number, number] => {
    if (behaviorSnapshot.fields.colorMapping.currentField === "byGradient") {
      const currentGradient =
        behaviorSnapshot.fields.colorMapping.switchFields.byGradient.gradient;

      const currentBrightness = perceptualLuminance(r, g, b);
      const currentColor = evalGradientAt(currentGradient, currentBrightness);
      return hexToRGBA(currentColor);
    } else {
      const numColors =
        behaviorSnapshot.fields.colorMapping.switchFields.byNumColors.numColors
          .value;
      const baseIncrement = 255 / Math.max(1, numColors - 1);
      const baseR = Math.round(r / baseIncrement) * baseIncrement;
      const baseG = Math.round(g / baseIncrement) * baseIncrement;
      const baseB = Math.round(b / baseIncrement) * baseIncrement;
      const baseA = Math.round(a / baseIncrement) * baseIncrement;
      return [baseR, baseG, baseB, baseA];
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
          const [tr, tg, tb, ta] = getNearestRGBA(r, g, b, a);
          const targetRGBDifference = computeRGBDifference(
            [r, g, b],
            [tr, tg, tb]
          );

          for (let i = 1; i <= 4; i++) {
            const xOffset = (((i + 1) % 3) - 1) * ditherSize;
            const yOffset = (i === 1 ? 0 : 1) * ditherSize;
            if (
              inImageBounds(outputImageData, x + xOffset, currentRow + yOffset)
            ) {
              const errorMultFactor =
                (i === 1 ? 7 : i === 2 ? 3 : i === 3 ? 5 : 1) / 16;

              // RGBA values of pixel that error should be diffused to
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
              setRGBA(outputImageData, x + i, currentRow + j, [tr, tg, tb, ta]);
            }
          }
        }
      }
      return [currentRow / height, output];
    };

    return stepFunction;
  } else {
    let bayerMatrix: number[][];
    let matrixSize: number;

    if (behaviorSnapshot.fields.ditherType.value === "bayer2x2") {
      matrixSize = 2;
      bayerMatrix = [
        [0, 2],
        [3, 1],
      ];
    } else if (behaviorSnapshot.fields.ditherType.value === "bayer4x4") {
      matrixSize = 4;
      bayerMatrix = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
    } else if (behaviorSnapshot.fields.ditherType.value === "bayer8x8") {
      matrixSize = 8;
      bayerMatrix = [
        [0, 32, 8, 40, 2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44, 4, 36, 14, 46, 6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3, 35, 11, 43, 1, 33, 9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47, 7, 39, 13, 45, 5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21],
      ];
    } else {
      matrixSize = 16;
      bayerMatrix = [
        [0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170],
        [
          192, 64, 224, 96, 200, 72, 232, 104, 194, 66, 226, 98, 202, 74, 234,
          106,
        ],
        [
          48, 176, 16, 144, 56, 184, 24, 152, 50, 178, 18, 146, 58, 186, 26,
          154,
        ],
        [
          240, 112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82, 250, 122,
          218, 90,
        ],
        [12, 140, 44, 172, 4, 132, 36, 164, 14, 142, 46, 174, 6, 134, 38, 166],
        [
          204, 76, 236, 108, 196, 68, 228, 100, 206, 78, 238, 110, 198, 70, 230,
          102,
        ],
        [
          60, 188, 28, 156, 52, 180, 20, 148, 62, 190, 30, 158, 54, 182, 22,
          150,
        ],
        [
          252, 124, 220, 92, 244, 116, 212, 84, 254, 126, 222, 94, 246, 118,
          214, 86,
        ],
        [3, 131, 35, 163, 11, 139, 43, 171, 1, 129, 33, 161, 9, 137, 41, 169],
        [
          195, 67, 227, 99, 203, 75, 235, 107, 193, 65, 225, 97, 201, 73, 233,
          105,
        ],
        [
          51, 179, 19, 147, 59, 187, 27, 155, 49, 177, 17, 145, 57, 185, 25,
          153,
        ],
        [
          243, 115, 211, 83, 251, 123, 219, 91, 241, 113, 209, 81, 249, 121,
          217, 89,
        ],
        [15, 143, 47, 175, 7, 135, 39, 167, 13, 141, 45, 173, 5, 133, 37, 165],
        [
          207, 79, 239, 111, 199, 71, 231, 103, 205, 77, 237, 109, 197, 69, 229,
          101,
        ],
        [
          63, 191, 31, 159, 55, 183, 23, 151, 61, 189, 29, 157, 53, 181, 21,
          149,
        ],
        [
          255, 127, 223, 95, 247, 119, 215, 87, 253, 125, 221, 93, 245, 117,
          213, 85,
        ],
      ];
    }

    const maxThreshold = matrixSize * matrixSize;

    const stepFunction: StepFunction = () => {
      const targetRow = currentRow + rowStep * ditherSize;
      for (
        ;
        currentRow < height && currentRow <= targetRow;
        currentRow += ditherSize
      ) {
        for (let x = 0; x < width; x += ditherSize) {
          const [r, g, b, a] = getRGBA(outputImageData, x, currentRow);

          // apply bayer color offsets
          const bayerX = Math.floor(x / ditherSize) % matrixSize;
          const bayerY = Math.floor(currentRow / ditherSize) % matrixSize;
          const threshold = (bayerMatrix[bayerY][bayerX] + 0.5) / maxThreshold;

          const adjustedR = r + (threshold - 0.5) * 64;
          const adjustedG = g + (threshold - 0.5) * 64;
          const adjustedB = b + (threshold - 0.5) * 64;

          const targetRGB = getNearestRGBA(adjustedR, adjustedG, adjustedB);

          // quantize color
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
 * @returns [difference in R, difference in G, difference in B]
 */
const computeRGBDifference = (
  color1: [number, number, number],
  color2: [number, number, number]
): [number, number, number] => {
  return [color1[0] - color2[0], color1[1] - color2[1], color1[2] - color2[2]];
};
