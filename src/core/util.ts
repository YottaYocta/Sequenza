import type { Behavior } from "./Behavior";

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

/**
 * Deep clones a Behavior object, handling Svelte proxy objects.
 * This function manually reconstructs the behavior to avoid issues with cloneBehavior on proxies.
 * @param behavior The behavior to clone
 * @returns A deep clone of the behavior
 */
export const cloneBehavior = <T extends Behavior>(behavior: T): T => {
  // Create a plain object by manually copying all properties
  const cloned: any = {
    type: behavior.type,
    fields: {},
  };

  // Deep clone each field in the fields record
  for (const [fieldName, field] of Object.entries(behavior.fields)) {
    if (field.type === "Numerical") {
      cloned.fields[fieldName] = {
        type: field.type,
        min: field.min,
        max: field.max,
        default: field.default,
        step: field.step,
        value: field.value,
      };
    } else if (field.type === "GradientMap") {
      cloned.fields[fieldName] = {
        type: field.type,
        stops: field.stops.map((stop) => ({
          position: stop.position,
          color: stop.color,
        })),
        easing: field.easing,
      };
    }
  }

  return cloned as T;
};

export const inImageBounds = (
  imageData: ImageData,
  x: number,
  y: number
): boolean => {
  return x < 0 || x >= imageData.width || y < 0 || y >= imageData.height;
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
  if (inImageBounds(imageData, x, y)) {
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
  if (inImageBounds(imageData, x, y)) {
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
