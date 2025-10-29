export type Adjustment =
  | {
      type: "HSL";
      hue: number;
      saturation: number;
      lightness: number;
      nextX: number;
      nextY: number;
    }
  | {
      type: "RGB";
      r: number;
      green: number;
      blue: number;
      nextX: number;
      nextY: number;
    };

// TODO: add gradient map

/**
 *
 * given the adjustment state + source image data, should process the next pixel at nextx and next y using the color space manipulation of rgb
 *  returns updated adjustment state (in this case, going to the next pixel or wrapping to the next row), updated image data (reference), and number between 0-1 representing progress
 */
export const processRGB = (
  adjustmentState: Adjustment & { type: "RGB" },
  source: ImageData,
  currentData: ImageData
): [Adjustment, ImageData, number] => {
  throw Error("not implemented");
};

export const createDefaultAdjustment = (type: "HSL" | "RGB"): Adjustment => {
  switch (type) {
    case "HSL":
      return {
        type: "HSL",
        hue: 0,
        saturation: 0,
        lightness: 0,
        nextX: 0,
        nextY: 0,
      };
    case "RGB":
      return {
        type: "RGB",
        r: 0,
        green: 0,
        blue: 0,
        nextX: 0,
        nextY: 0,
      };
  }
};
