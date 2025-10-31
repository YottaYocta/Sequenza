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
    }
  | {
      type: "GRADMAP";
      stops: { position: number; color: string }[];
      interpolation: "linear" | "constant";
    };

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

export const createDefaultAdjustment = (type: "HSL" | "RGB" | "GRADMAP"): Adjustment => {
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
    case "GRADMAP":
      return {
        type: "GRADMAP",
        stops: [
          { position: 0, color: "#000000" },
          { position: 1, color: "#ffffff" },
        ],
        interpolation: "linear",
      };
  }
};

/**
 * Helper function to parse hex color string to RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return [r, g, b];
};

/**
 * Helper function to convert RGB to hex string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Helper function to linearly interpolate between two colors
 */
const interpolateColors = (
  color1: string,
  color2: string,
  t: number
): string => {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;

  return rgbToHex(r, g, b);
};

/**
 *
 * @param behavior gradient behavior
 * @param progress value between 0 and 1 corresponding to gradient progress
 * @returns a hex string for the color
 */
export const evalGradientAt = (
  behavior: Adjustment & { type: "GRADMAP" },
  progress: number
): string => {
  const { stops, interpolation } = behavior;

  // Clamp progress to 0-1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Sort stops by position (in case they're not sorted)
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  // Handle edge cases
  if (sortedStops.length === 0) {
    return "#000000"; // Default to black if no stops
  }
  if (sortedStops.length === 1) {
    return sortedStops[0].color;
  }

  // Find the two stops that bracket the progress value
  let lowerStop = sortedStops[0];
  let upperStop = sortedStops[sortedStops.length - 1];

  // If progress is before first stop
  if (clampedProgress <= sortedStops[0].position) {
    return sortedStops[0].color;
  }

  // If progress is after last stop
  if (clampedProgress >= sortedStops[sortedStops.length - 1].position) {
    return sortedStops[sortedStops.length - 1].color;
  }

  // Find the bracketing stops
  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (
      clampedProgress >= sortedStops[i].position &&
      clampedProgress <= sortedStops[i + 1].position
    ) {
      lowerStop = sortedStops[i];
      upperStop = sortedStops[i + 1];
      break;
    }
  }

  // Calculate local t value between the two stops
  const range = upperStop.position - lowerStop.position;
  const localT = range === 0 ? 0 : (clampedProgress - lowerStop.position) / range;

  // Apply interpolation type
  if (interpolation === "constant") {
    // Constant interpolation: use the lower stop's color
    return lowerStop.color;
  } else {
    // Linear interpolation
    return interpolateColors(lowerStop.color, upperStop.color, localT);
  }
};

/**
 *
 * @param behavior gradient map behavior
 * @param inputData source data to apply the map to
 * @returns a new instance of ImageData containing the mapped image
 */
export const processGradientMap = (
  behavior: Adjustment & { type: "GRADMAP" },
  inputData: ImageData
): ImageData => {
  const { width, height, data } = inputData;

  // Create a new ImageData for the output
  const outputData = new ImageData(width, height);

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Calculate brightness/luminance of the pixel (0-1)
    // Using relative luminance formula (perceived brightness)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Get the gradient color at this brightness level
    const gradientColor = evalGradientAt(behavior, brightness);

    // Parse the gradient color
    const [newR, newG, newB] = hexToRgb(gradientColor);

    // Write the mapped color to output
    outputData.data[i] = newR;
    outputData.data[i + 1] = newG;
    outputData.data[i + 2] = newB;
    outputData.data[i + 3] = a; // Preserve alpha channel
  }

  return outputData;
};
