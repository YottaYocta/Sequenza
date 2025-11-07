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
import { cloneBehavior, getRGBA, setRGBA } from "../core/util";

export interface DitherBehavior extends Behavior {
  type: "dither";
  fields: {
    numColors: NumericalField;
  };
}

export const newDitherBehavior = (numColors = 2): DitherBehavior => {
  return {
    type: "dither",
    fields: {
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

  let currentRow = 0;
  const pixelsPerStep = 10000;
  const rowStep = Math.floor(pixelsPerStep / width);

  const stepFunction: StepFunction = () => {
    const targetRow = currentRow + rowStep;
    for (; currentRow < height && currentRow <= targetRow; currentRow++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b] = getRGBA(inputImageData, x, currentRow);
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

        if (diffWhite > diffBlack) {
          // TODO
        } else {
          // TODO
        }
      }
    }
  };

  throw Error("not implemented yet");
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
