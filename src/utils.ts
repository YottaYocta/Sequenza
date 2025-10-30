/**
 * Performs linear interpolation between two numbers.
 *
 * @param a The starting value.
 * @param b The ending value.
 * @param t The interpolation factor, typically between 0 and 1.
 *          If t is 0, the result is 'a'.
 *          If t is 1, the result is 'b'.
 *          If t is between 0 and 1, the result is a value between 'a' and 'b'.
 *          Values of t outside [0, 1] will result in extrapolation.
 * @returns The interpolated value.
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Converts SVG string to ImageData using an offline canvas.
 *
 * @param svgString The SVG string to render
 * @param width Target width for the rendered image
 * @param height Target height for the rendered image
 * @returns Promise that resolves to ImageData
 */
export const svgToImageData = async (
  svgString: string,
  width: number,
  height: number
): Promise<ImageData> => {
  // Validate dimensions
  if (width <= 0 || height <= 0) {
    throw new Error(
      `Invalid dimensions for SVG conversion: ${width}x${height}`
    );
  }

  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();

    img.onload = () => {
      // Create an offline canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Extract ImageData
      const imageData = ctx.getImageData(0, 0, width, height);

      resolve(imageData);
    };

    img.onerror = (e) => {
      console.error("SVG load error:", e);
      console.error("SVG string:", svgString);
      reject(new Error("Failed to load SVG image"));
    };

    // Use data URL instead of blob URL to avoid CORS issues
    const encodedSvg = encodeURIComponent(svgString)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    img.src = `data:image/svg+xml,${encodedSvg}`;
  });
};
