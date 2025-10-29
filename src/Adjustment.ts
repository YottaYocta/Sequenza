export type Adjustment =
  | { type: "HSL"; hue: number; saturation: number; lightness: number }
  | { type: "RGB"; r: number; green: number; blue: number };

// TODO: add gradient map

export const createDefaultAdjustment = (type: "HSL" | "RGB"): Adjustment => {
  // TODO
  throw Error("not implemented yet");
};
