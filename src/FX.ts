import type { SvgOutput } from "./ProcessingNode";

export type MidPassFilter = {
  // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
  low: number;
  high: number;
};

/**
 * Creates a default SvgOutput structure with optional viewBox parameters
 */
export const createDefaultSvgOutput = (
  width: number = 0,
  height: number = 0,
  x: number = 0,
  y: number = 0
): SvgOutput => {
  return {
    viewBox: {
      x,
      y,
      width,
      height,
    },
    children: [],
  };
};

interface DotFX {
  type: "dot";
  horizontalCount: number;
  verticalCount: number;
  dotRadius: number;
  borderRadius: number; // clamped to -1 to 1, with 0 being no corners (creates pixels) and 1 being equal to the dotRadius (fully rounded). -1 corresponds to a star shape (four pointed star; a circle but with edges concave, leaving 4 points)
  // controls the rotation of each Dot individually
  rotation: number;
  filter: MidPassFilter;
  state: {
    nextRow: number; // which row to process next (0 to verticalCount-1)
  };
}

interface BarFX {
  type: "bar";
  direction: "horizontal" | "vertical";
  numberBars: number;
  barSize: number;
  borderRadius: number; // clamped 0 -1, with 0 being no corners and 1 being fully rounded
  filter: MidPassFilter;
  state: {
    nextBar: number; // column or row, depending on direction
  };
}

interface AsciiFX {
  type: "ascii";
  charSize: number; // size of each character cell in pixels
  filter: MidPassFilter;
  state: {
    nextRow: number; // which row to process next
  };
}

export type FX = DotFX | BarFX | AsciiFX;

export const newFX = (type: "dot" | "bar" | "ascii"): FX => {
  switch (type) {
    case "dot":
      return {
        type: "dot",
        horizontalCount: 10,
        verticalCount: 10,
        dotRadius: 5,
        borderRadius: 1,
        rotation: 0,
        filter: {
          low: 0,
          high: 1,
        },
        state: {
          nextRow: 0,
        },
      };
    case "bar":
      return {
        type: "bar",
        direction: "horizontal",
        numberBars: 10,
        barSize: 5,
        borderRadius: 0,
        filter: {
          low: 0,
          high: 1,
        },
        state: {
          nextBar: 0,
        },
      };
    case "ascii":
      return {
        type: "ascii",
        charSize: 10,
        filter: {
          low: 0,
          high: 1,
        },
        state: {
          nextRow: 0,
        },
      };
  }
};

/**
 * Create a dot shape (circle, square, or star depending on borderRadius)
 */
function createDotShape(
  x: number,
  y: number,
  size: number,
  borderRadius: number,
  rotation: number
): string {
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
}

/**
 * Create a 4-pointed star path
 */
function createStarPath(size: number): string {
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
}

/**
 * given the FX state + source image data, should process the next row of dots
 * Mutates the svgData by appending new child elements
 * returns updated FX state (advancing to the next row) and number between 0-1 representing progress
 */
export const processDot = (
  fxState: FX & { type: "dot" },
  source: ImageData,
  svgData: SvgOutput
): [FX, number] => {
  const {
    state,
    horizontalCount,
    verticalCount,
    dotRadius,
    borderRadius,
    rotation,
    filter,
  } = fxState;

  const nextRow = state.nextRow;
  const width = source.width;
  const height = source.height;
  const data = source.data;

  // Calculate cell dimensions
  const cellWidth = width / horizontalCount;
  const cellHeight = height / verticalCount;

  // Process current row of dots (grid row, not pixel row)
  let rowSVG = "";

  for (let col = 0; col < horizontalCount; col++) {
    // Calculate the center pixel of this grid cell
    const centerX = Math.floor(col * cellWidth + cellWidth / 2);
    const centerY = Math.floor(nextRow * cellHeight + cellHeight / 2);

    // Ensure we're within image bounds
    if (centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) {
      continue;
    }

    // Sample the pixel at the center of the cell
    const index = (centerY * width + centerX) * 4;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3] / 255;

    // Calculate brightness (value in HSV) for filtering
    const brightness = (r + g + b) / (3 * 255);

    // Apply midpass filter - skip pixels outside the value range
    const clampedLow = Math.max(0, Math.min(1, filter.low));
    const clampedHigh = Math.max(0, Math.min(1, filter.high));
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
    svgData.children.push(rowSVG);
  }

  // Calculate next row
  const newNextRow = nextRow + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextRow / verticalCount);

  // Create updated FX state
  const updatedState: FX = {
    ...fxState,
    state: {
      nextRow: newNextRow,
    },
  };

  return [updatedState, progress];
};

/**
 * Helper function to find the most frequently occurring color in a region
 */
function getMostFrequentColor(
  data: Uint8ClampedArray,
  indices: number[]
): [number, number, number, number] {
  const colorMap = new Map<
    string,
    { count: number; rgba: [number, number, number, number] }
  >();

  for (const index of indices) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    // Use rounded values to group similar colors
    const key = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${
      Math.round(b / 10) * 10
    }`;

    if (colorMap.has(key)) {
      const entry = colorMap.get(key)!;
      entry.count++;
    } else {
      colorMap.set(key, { count: 1, rgba: [r, g, b, a] });
    }
  }

  // Find the most frequent color
  let maxCount = 0;
  let mostFrequent: [number, number, number, number] = [0, 0, 0, 255];

  for (const entry of colorMap.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      mostFrequent = entry.rgba;
    }
  }

  return mostFrequent;
}

/**
 * Create a bar shape (rectangle with optional rounded corners)
 */
function createBarShape(
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number
): string {
  const clampedRadius = Math.max(0, Math.min(1, borderRadius));
  const actualRadius = Math.min(width, height) * clampedRadius * 0.5;

  if (clampedRadius > 0) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${actualRadius}" />`;
  } else {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" />`;
  }
}

/**
 * Process one bar (column or row depending on direction)
 * Mutates the svgData by appending new child elements
 * Returns updated FX state and progress (0-1)
 */
export const processBar = (
  fxState: FX & { type: "bar" },
  source: ImageData,
  svgData: SvgOutput
): [FX, number] => {
  const { state, direction, numberBars, barSize, borderRadius, filter } =
    fxState;

  const nextBar = state.nextBar;
  const width = source.width;
  const height = source.height;
  const data = source.data;

  let barSVG = "";

  if (direction === "horizontal") {
    // Horizontal bars - process one row of bars at a time
    const barHeight = height / numberBars;
    const startY = Math.floor(nextBar * barHeight);
    const endY = Math.floor((nextBar + 1) * barHeight);

    // Collect all pixel indices in this bar region
    const indices: number[] = [];
    for (let y = startY; y < endY && y < height; y++) {
      for (let x = 0; x < width; x++) {
        indices.push((y * width + x) * 4);
      }
    }

    // Get the most frequent color in this region
    const [r, g, b, a] = getMostFrequentColor(data, indices);

    // Calculate brightness for filtering
    const brightness = (r + g + b) / (3 * 255);

    // Apply midpass filter
    const clampedLow = Math.max(0, Math.min(1, filter.low));
    const clampedHigh = Math.max(0, Math.min(1, filter.high));

    if (brightness >= clampedLow && brightness <= clampedHigh) {
      // Draw horizontal bar centered in the region
      const centerY = (startY + endY) / 2;
      const barY = centerY - barSize / 2;

      const barShape = createBarShape(0, barY, width, barSize, borderRadius);
      barSVG = barShape.replace(
        "<rect",
        `<rect fill="rgba(${r}, ${g}, ${b}, ${a / 255})"`
      );
    }
  } else {
    // Vertical bars - process one column of bars at a time
    const barWidth = width / numberBars;
    const startX = Math.floor(nextBar * barWidth);
    const endX = Math.floor((nextBar + 1) * barWidth);

    // Collect all pixel indices in this bar region
    const indices: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX && x < width; x++) {
        indices.push((y * width + x) * 4);
      }
    }

    // Get the most frequent color in this region
    const [r, g, b, a] = getMostFrequentColor(data, indices);

    // Calculate brightness for filtering
    const brightness = (r + g + b) / (3 * 255);

    // Apply midpass filter
    const clampedLow = Math.max(0, Math.min(1, filter.low));
    const clampedHigh = Math.max(0, Math.min(1, filter.high));

    if (brightness >= clampedLow && brightness <= clampedHigh) {
      // Draw vertical bar centered in the region
      const centerX = (startX + endX) / 2;
      const barX = centerX - barSize / 2;

      const barShape = createBarShape(barX, 0, barSize, height, borderRadius);
      barSVG = barShape.replace(
        "<rect",
        `<rect fill="rgba(${r}, ${g}, ${b}, ${a / 255})"`
      );
    }
  }

  // Append this bar to the SVG children array
  if (barSVG.length > 0) {
    svgData.children.push(barSVG);
  }

  // Calculate next bar
  const newNextBar = nextBar + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextBar / numberBars);

  // Create updated FX state
  const updatedState: FX = {
    ...fxState,
    state: {
      nextBar: newNextBar,
    },
  };

  return [updatedState, progress];
};

// ASCII character set ordered by density (from darkest to lightest)
const ASCII_CHARS = " .:-=+*#%@";

/**
 * Map brightness (0-1) to an ASCII character
 */
function brightnessToChar(brightness: number): string {
  const index = Math.floor(brightness * (ASCII_CHARS.length - 1));
  return ASCII_CHARS[ASCII_CHARS.length - 1 - index]; // Reverse for correct mapping
}

/**
 * Process one row of ASCII characters
 * Returns updated FX state, ImageData output, and progress (0-1)
 */
export const processAscii = (
  fxState: FX & { type: "ascii" },
  source: ImageData,
  currentImageData: ImageData
): [FX, ImageData, number] => {
  const { state, charSize, filter } = fxState;

  const nextRow = state.nextRow;
  const width = source.width;
  const height = source.height;
  const sourceData = source.data;

  // Calculate number of rows and columns based on charSize
  const cols = Math.floor(width / charSize);
  const rows = Math.floor(height / charSize);

  // Create a temporary canvas to render text
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext("2d")!;

  // Copy current image data to canvas
  ctx.putImageData(currentImageData, 0, 0);

  // Set up text rendering
  ctx.font = `${charSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Process current row of characters
  for (let col = 0; col < cols; col++) {
    // Calculate the center pixel of this character cell
    const centerX = Math.floor(col * charSize + charSize / 2);
    const centerY = Math.floor(nextRow * charSize + charSize / 2);

    // Ensure we're within image bounds
    if (centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) {
      continue;
    }

    // Sample the pixel at the center of the cell
    const index = (centerY * width + centerX) * 4;
    const r = sourceData[index];
    const g = sourceData[index + 1];
    const b = sourceData[index + 2];
    const a = sourceData[index + 3] / 255;

    // Calculate brightness for filtering and character selection
    const brightness = (r + g + b) / (3 * 255);

    // Apply midpass filter - skip characters outside the value range
    const clampedLow = Math.max(0, Math.min(1, filter.low));
    const clampedHigh = Math.max(0, Math.min(1, filter.high));
    if (brightness < clampedLow || brightness > clampedHigh) {
      continue;
    }

    // Select ASCII character based on brightness
    const char = brightnessToChar(brightness);

    // Draw the character with the sampled color
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillText(char, centerX, centerY);
  }

  // Get the updated image data from canvas
  const updatedImageData = ctx.getImageData(0, 0, width, height);

  // Calculate next row
  const newNextRow = nextRow + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextRow / rows);

  // Create updated FX state
  const updatedState: FX = {
    ...fxState,
    state: {
      nextRow: newNextRow,
    },
  };

  return [updatedState, updatedImageData, progress];
};
