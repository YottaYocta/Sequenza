import {
  newNumericalField,
  type Behavior,
  type NumericalField,
} from "../core/Behavior";
import { outputToImageData, type Output } from "../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../core/ProcessingUnit";
import { cloneBehavior, getRGBA, inImageBounds, setRGBA } from "../core/util";

export interface DitherBehavior extends Behavior {
  type: "dither";
  fields: {
    ditherSize: NumericalField;
    numColors: NumericalField;
  };
}

export const createDitherBehavior = (numColors = 2): DitherBehavior => {
  return {
    type: "dither",
    fields: {
      ditherSize: newNumericalField(1, 16, 2, 1, 2),
      numColors: newNumericalField(2, 8, 4, 1, numColors),
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
    const diffWhite = computeRGBDifference([r, g, b], [255, 255, 255]);
    const diffBlack = computeRGBDifference([r, g, b], [0, 0, 0]);
    const totalDiffWhite = diffWhite.reduce(
      (prev, curr) => prev + Math.abs(curr),
      0
    );
    const totalDiffBlack = diffBlack.reduce(
      (prev, curr) => prev + Math.abs(curr),
      0
    );
    if (totalDiffBlack > totalDiffWhite) return [255, 255, 255];
    else return [0, 0, 0];
  };

  const stepFunction: StepFunction = () => {
    const targetRow = currentRow + rowStep;
    for (; currentRow < height && currentRow <= targetRow; currentRow++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b, a] = getRGBA(outputImageData, x, currentRow);
        const targetRGB = getNearestRGB(r, g, b);
        const targetRGBDifference = computeRGBDifference([r, g, b], targetRGB);

        for (let i = 1; i <= 4; i++) {
          const xOffset = ((i + 1) % 3) - 1;
          const yOffset = i === 1 ? 0 : 1;
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

        setRGBA(outputImageData, x, currentRow, [
          targetRGB[0],
          targetRGB[1],
          targetRGB[2],
          a,
        ]);
      }
    }
    return [currentRow / height, output];
  };

  return stepFunction;
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
