export interface Chunk {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Divides an ImageData into a list of rectangular chunks.
 * @param imageData The image to divide into chunks
 * @param chunkWidth The width of each chunk in pixels
 * @param chunkHeight The height of each chunk in pixels
 * @returns An array of chunks covering the entire image
 */
export const generateChunks = (
  imageData: ImageData,
  chunkWidth: number,
  chunkHeight: number
): Chunk[] => {
  const chunks: Chunk[] = [];
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y += chunkHeight) {
    for (let x = 0; x < width; x += chunkWidth) {
      chunks.push({
        startX: x,
        startY: y,
        endX: Math.min(x + chunkWidth, width),
        endY: Math.min(y + chunkHeight, height),
      });
    }
  }

  return chunks;
};

export const inImageBounds = (
  imageData: ImageData,
  x: number,
  y: number
): boolean => {
  return !(x < 0 || x >= imageData.width || y < 0 || y >= imageData.height);
};

/**
 *
 * @param data source ImageData using RGBA color format
 * @param x coord of target pixel
 * @param y coord of target pixel
 * @returns array containing [r, g, b, a]
 */
export const getRGBA = (
  imageData: ImageData,
  x: number,
  y: number
): [number, number, number, number] => {
  if (!inImageBounds(imageData, x, y)) {
    throw Error(
      `pixel at (x: ${x}, y:${y}) is out of bounds for image of size ${imageData.width} x ${imageData.height}`
    );
  } else {
    const baseIndex = (y * imageData.width + x) * 4;
    return [
      imageData.data[baseIndex],
      imageData.data[baseIndex + 1],
      imageData.data[baseIndex + 2],
      imageData.data[baseIndex + 3],
    ];
  }
};

/**
 *
 * @param data imageData to manipulate
 * @param x target pixel's x coord
 * @param y target pixel's y coord
 * @param rgba target RGBA value to set the pixel to
 */
export const setRGBA = (
  imageData: ImageData,
  x: number,
  y: number,
  rgba: [number, number, number, number]
) => {
  if (!inImageBounds(imageData, x, y)) {
    throw Error(
      `pixel at (x: ${x}, y:${y}) is out of bounds for image of size ${imageData.width} x ${imageData.height}`
    );
  } else {
    const baseIndex = (y * imageData.width + x) * 4;
    imageData.data[baseIndex] = rgba[0];
    imageData.data[baseIndex + 1] = rgba[1];
    imageData.data[baseIndex + 2] = rgba[2];
    imageData.data[baseIndex + 3] = rgba[3];
  }
};

/**
 *
 * returns perceived luminance of rgb color on range [0 - 1], with 0 being darkest possible luminance
 * @param r [0, 255]
 * @param g [0, 255]
 * @param b [0, 255]
 */
export const perceptualLuminance = (
  r: number,
  g: number,
  b: number
): number => {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/**
 * Helper function to parse hex color string to RGB
 */
export const hexToRGBA = (hex: string): [number, number, number, number] => {
  const cleanHex = hex.replace(/^#/, "");

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const a = parseInt(cleanHex.substring(6, 8), 16);

  return [r, g, b, Number.isNaN(a) ? 255 : a];
};

const toHex = (n: number) => {
  const clamped = Math.max(0, Math.min(255, Math.round(n)));
  return clamped.toString(16).padStart(2, "0");
};

/**
 * Helper function to convert RGB to hex string
 */
export const RGBAToHex = (r: number, g: number, b: number, a = 255): string => {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
};

/**
 * Standard vertex shader for WebGL rendering
 */
export const STANDARD_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

/**
 * Helper function to linearly interpolate between two colors
 */
export const interpolateColors = (
  color1: string,
  color2: string,
  t: number
): string => {
  const [r1, g1, b1, a1] = hexToRGBA(color1);
  const [r2, g2, b2, a2] = hexToRGBA(color2);

  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  const a = a1 + (a2 - a1) * t;

  return RGBAToHex(r, g, b, a);
};
