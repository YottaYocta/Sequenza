export interface SvgOutput {
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children: string[];
}

export type Output =
  | { type: "image"; data: ImageData }
  | { type: "svg"; data: SvgOutput };

/**
 * Converts an Output to ImageData.
 * For image outputs, returns the data directly.
 * For SVG outputs, renders to an OffscreenCanvas and extracts ImageData.
 */
export const outputToImageData = async (output: Output): Promise<ImageData> => {
  if (output.type === "image") {
    return output.data;
  }

  // get source data + canvas
  const svg = output.data;
  const canvas = new OffscreenCanvas(svg.viewBox.width, svg.viewBox.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context from OffscreenCanvas");
  }

  // create svg image url
  const svgString = `<svg viewBox="${svg.viewBox.x} ${svg.viewBox.y} ${
    svg.viewBox.width
  } ${
    svg.viewBox.height
  }" xmlns="http://www.w3.org/2000/svg">${svg.children.join("")}</svg>`;
  const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);

  // render new image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, svg.viewBox.width, svg.viewBox.height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };
    img.src = url;
  });

  return ctx.getImageData(0, 0, svg.viewBox.width, svg.viewBox.height);
};
