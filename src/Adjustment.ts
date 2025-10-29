export type Adjustment =
  | {
      type: "HSL";
      hue: number;
      saturation: number;
      lightness: number;
      state: {
        nextRow: number; // which row to process next (0 to height-1)
      };
    }
  | {
      type: "RGB";
      red: number;
      green: number;
      blue: number;
      state: {
        nextRow: number; // which row to process next (0 to height-1)
      };
    };

// TODO: add gradient map

/**
 * Convert RGB (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1)
 */
const rgbToHsl = (
  r: number,
  g: number,
  b: number
): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
};

/**
 * Convert HSL (H: 0-360, S: 0-1, L: 0-1) to RGB (0-255)
 */
const hslToRgb = (
  h: number,
  s: number,
  l: number
): [number, number, number] => {
  h = h / 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * given the adjustment state + source image data, should process the next row using RGB color space manipulation
 * returns updated adjustment state (advancing to the next row), updated image data (reference), and number between 0-1 representing progress
 */
export const processRGB = (
  adjustmentState: Adjustment & { type: "RGB" },
  source: ImageData,
  currentData: ImageData
): [Adjustment, ImageData, number] => {
  const { state, red, green, blue } = adjustmentState;
  const nextRow = state.nextRow;
  const width = source.width;
  const height = source.height;

  // Process entire row
  for (let x = 0; x < width; x++) {
    // Calculate pixel index (RGBA format: 4 bytes per pixel)
    const index = (nextRow * width + x) * 4;

    // Get source pixel values
    const sourceR = source.data[index];
    const sourceG = source.data[index + 1];
    const sourceB = source.data[index + 2];
    const sourceA = source.data[index + 3];

    // Apply RGB adjustments (clamped to 0-255)
    currentData.data[index] = Math.max(0, Math.min(255, sourceR + red));
    currentData.data[index + 1] = Math.max(0, Math.min(255, sourceG + green));
    currentData.data[index + 2] = Math.max(0, Math.min(255, sourceB + blue));
    currentData.data[index + 3] = sourceA; // Keep alpha unchanged
  }

  // Calculate next row
  const newNextRow = nextRow + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextRow / height);

  // Create updated adjustment state
  const updatedState: Adjustment = {
    ...adjustmentState,
    state: {
      nextRow: newNextRow,
    },
  };

  return [updatedState, currentData, progress];
};

/**
 * given the adjustment state + source image data, should process the next row using HSL color space manipulation
 * returns updated adjustment state (advancing to the next row), updated image data (reference), and number between 0-1 representing progress
 */
export const processHSL = (
  adjustmentState: Adjustment & { type: "HSL" },
  source: ImageData,
  currentData: ImageData
): [Adjustment, ImageData, number] => {
  const { state, hue, saturation, lightness } = adjustmentState;
  const nextRow = state.nextRow;
  const width = source.width;
  const height = source.height;

  // Process entire row
  for (let x = 0; x < width; x++) {
    // Calculate pixel index (RGBA format: 4 bytes per pixel)
    const index = (nextRow * width + x) * 4;

    // Get source pixel values
    const sourceR = source.data[index];
    const sourceG = source.data[index + 1];
    const sourceB = source.data[index + 2];
    const sourceA = source.data[index + 3];

    // Convert RGB to HSL
    let [h, s, l] = rgbToHsl(sourceR, sourceG, sourceB);

    // Apply HSL adjustments
    h = (h + hue) % 360; // Hue wraps around
    if (h < 0) h += 360;
    s = Math.max(0, Math.min(1, s + saturation)); // Saturation clamped to 0-1
    l = Math.max(0, Math.min(1, l + lightness)); // Lightness clamped to 0-1

    // Convert back to RGB
    const [newR, newG, newB] = hslToRgb(h, s, l);

    // Write adjusted values
    currentData.data[index] = newR;
    currentData.data[index + 1] = newG;
    currentData.data[index + 2] = newB;
    currentData.data[index + 3] = sourceA; // Keep alpha unchanged
  }

  // Calculate next row
  const newNextRow = nextRow + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextRow / height);

  // Create updated adjustment state
  const updatedState: Adjustment = {
    ...adjustmentState,
    state: {
      nextRow: newNextRow,
    },
  };

  return [updatedState, currentData, progress];
};

export const createDefaultAdjustment = (type: "HSL" | "RGB"): Adjustment => {
  switch (type) {
    case "HSL":
      return {
        type: "HSL",
        hue: 0,
        saturation: 0,
        lightness: 0,
        state: {
          nextRow: 0,
        },
      };
    case "RGB":
      return {
        type: "RGB",
        red: 0,
        green: 0,
        blue: 0,
        state: {
          nextRow: 0,
        },
      };
  }
};
