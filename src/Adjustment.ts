export type Adjustment =
  | { type: "HSL"; hue: number; saturation: number; lightness: number }
  | { type: "RGB"; r: number; green: number; blue: number };

// TODO: add gradient map

export const createDefaultAdjustment = (type: "HSL" | "RGB"): Adjustment => {
  switch (type) {
    case "HSL":
      return {
        type: "HSL",
        hue: 0,
        saturation: 0,
        lightness: 0,
      };
    case "RGB":
      return {
        type: "RGB",
        r: 0,
        green: 0,
        blue: 0,
      };
  }
};
