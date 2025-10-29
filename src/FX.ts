export type MidPassFilter = {
  // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
  low: number;
  high: number;
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
  nextRow: number; // which row to process next (0 to verticalCount-1)
}

export type FX = DotFX;

export const newFX = (type: "dot"): FX => {
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
        nextRow: 0,
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
 * returns updated FX state (advancing to the next row), SVG string output, and number between 0-1 representing progress
 */
export const processDot = (
  fxState: FX & { type: "dot" },
  source: ImageData,
  currentSVG: string
): [FX, string, number] => {
  const {
    nextRow,
    horizontalCount,
    verticalCount,
    dotRadius,
    borderRadius,
    rotation,
    filter,
  } = fxState;

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

  // Append this row's dots to the current SVG
  const updatedSVG = currentSVG + rowSVG;

  // Calculate next row
  const newNextRow = nextRow + 1;

  // Calculate progress (0-1)
  const progress = Math.min(1, newNextRow / verticalCount);

  // Create updated FX state
  const updatedState: FX = {
    ...fxState,
    nextRow: newNextRow,
  };

  return [updatedState, updatedSVG, progress];
};
