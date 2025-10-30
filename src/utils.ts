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
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();

    // Create a Blob from the SVG string
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Create an offline canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Extract ImageData
      const imageData = ctx.getImageData(0, 0, width, height);

      // Clean up
      URL.revokeObjectURL(url);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = url;
  });
};
