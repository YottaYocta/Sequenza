import type { Adjustment } from "./Adjustment";
import { processRGB, processHSL, processGradientMap } from "./Adjustment";
import type { FX } from "./FX";
import {
  processDot,
  processBar,
  processAscii,
  createDefaultSvgOutput,
} from "./FX";
import { svgToImageData } from "./utils";

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
 * Converts SvgOutput to complete SVG string
 */
const svgOutputToString = (svg: SvgOutput): string => {
  const { viewBox, children } = svg;
  return `<svg viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${
    viewBox.height
  }" xmlns="http://www.w3.org/2000/svg">${children.join("")}</svg>`;
};

/**
 * Extracts ImageData from Output.
 * If output is already ImageData, returns it directly.
 * If output is SVG, converts it to ImageData using offline canvas rendering.
 */
export const getImageData = async (output: Output): Promise<ImageData> => {
  if (output.type === "image") {
    return output.data;
  }

  const { width, height } = output.data.viewBox;

  // Handle empty/uninitialized SVG (0x0 dimensions)
  if (width <= 0 || height <= 0) {
    // Return a 1x1 transparent ImageData as fallback
    return new ImageData(1, 1);
  }

  // Convert SVG structure to string
  const svgString = svgOutputToString(output.data);

  return await svgToImageData(svgString, width, height);
};

/**
 * Extracts SVG string from Output.
 * If output is SVG, converts the structure to a complete SVG string.
 * If output is ImageData, returns null (cannot convert ImageData to SVG).
 */
export const getSvgData = (output: Output): string | null => {
  if (output.type === "svg") {
    return svgOutputToString(output.data);
  }
  // Cannot convert ImageData to SVG
  return null;
};

export interface ProccessingNode<T extends Adjustment | FX> {
  progress: number;
  behavior: T;
  outputData: Output; // the output could either be another image or a string
}

/**
 * Unified function to reset a node's state and progress
 * Sets progress to 0 and resets state fields appropriately for each type
 */
export function resetNodeState<T extends Adjustment | FX>(
  node: ProccessingNode<T>,
  sourceImageData: ImageData
): ProccessingNode<T> {
  const behavior = node.behavior;

  // Reset state for the behavior
  let resetBehavior: T;
  if ("state" in behavior) {
    // All our types now have state
    resetBehavior = {
      ...behavior,
      state: {
        nextRow: 0,
      },
    } as T;
  } else {
    resetBehavior = behavior;
  }

  // Reinitialize output data based on type
  let resetOutputData: Output;
  if (node.outputData.type === "image") {
    resetOutputData = {
      type: "image",
      data: new ImageData(sourceImageData.width, sourceImageData.height),
    };
  } else {
    // For SVG, initialize with empty children array
    resetOutputData = {
      type: "svg",
      data: createDefaultSvgOutput(
        sourceImageData.width,
        sourceImageData.height
      ),
    };
  }

  return {
    ...node,
    progress: 0,
    behavior: resetBehavior,
    outputData: resetOutputData,
  };
}

/**
 *
 * @param node the node to step
 * @param source the image source the node should reference
 *
 * given the current node state and the image source it should operate on, matches with adjustment or fx handler and computes one iteration of the processing.
 *
 */
export const updateProcessingNode = <T extends FX | Adjustment>(
  node: ProccessingNode<T>,
  source: ImageData
): ProccessingNode<T> => {
  const { behavior, outputData } = node;

  // Get current image data (or create if doesn't exist)
  let currentData: ImageData;
  if (outputData.type === "image") {
    currentData = outputData.data;
  } else {
    // Initialize with source dimensions
    currentData = new ImageData(source.width, source.height);
  }

  // Determine if FX or Adjustment and dispatch to appropriate handler
  if ("type" in behavior) {
    // Check if it's an Adjustment type
    if (
      behavior.type === "RGB" ||
      behavior.type === "HSL" ||
      behavior.type === "GRADMAP"
    ) {
      const adjustment = behavior as Adjustment;

      switch (adjustment.type) {
        case "RGB": {
          const [updatedBehavior, updatedImageData, progress] = processRGB(
            adjustment as Adjustment & { type: "RGB" },
            source,
            currentData
          );

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "image", data: updatedImageData },
          };
        }
        case "HSL": {
          const [updatedBehavior, updatedImageData, progress] = processHSL(
            adjustment as Adjustment & { type: "HSL" },
            source,
            currentData
          );

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "image", data: updatedImageData },
          };
        }
        case "GRADMAP": {
          // GRADMAP processes the entire image at once (non-incremental)
          const updatedImageData = processGradientMap(
            adjustment as Adjustment & { type: "GRADMAP" },
            source
          );

          return {
            progress: 1, // Completes immediately
            behavior: adjustment as T,
            outputData: { type: "image", data: updatedImageData },
          };
        }
      }
    }

    // Check if it's an FX type
    if (
      behavior.type === "dot" ||
      behavior.type === "bar" ||
      behavior.type === "ascii"
    ) {
      const fx = behavior as FX;

      switch (fx.type) {
        case "dot": {
          // Get current SVG data or initialize
          let svgData: SvgOutput;
          if (outputData.type === "svg") {
            svgData = outputData.data;
          } else {
            // Initialize new SVG structure
            svgData = createDefaultSvgOutput(source.width, source.height);
          }

          const [updatedBehavior, progress] = processDot(
            fx as FX & { type: "dot" },
            source,
            svgData
          );

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "svg", data: svgData },
          };
        }
        case "bar": {
          // Get current SVG data or initialize
          let svgData: SvgOutput;
          if (outputData.type === "svg") {
            svgData = outputData.data;
          } else {
            // Initialize new SVG structure
            svgData = createDefaultSvgOutput(source.width, source.height);
          }

          const [updatedBehavior, progress] = processBar(
            fx as FX & { type: "bar" },
            source,
            svgData
          );

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "svg", data: svgData },
          };
        }
        case "ascii": {
          const [updatedBehavior, updatedImageData, progress] = processAscii(
            fx as FX & { type: "ascii" },
            source,
            currentData
          );

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "image", data: updatedImageData },
          };
        }
      }
    }
  }

  throw Error("Unknown behavior type");
};
