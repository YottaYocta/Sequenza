import type { Adjustment } from "./Adjustment";
import { processRGB, processHSL } from "./Adjustment";
import type { FX } from "./FX";
import { processDot, processBar } from "./FX";

export type Output =
  | { type: "image"; data: ImageData }
  | { type: "svg"; data: string };

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
    // For SVG, initialize with empty string
    resetOutputData = { type: "svg", data: "" };
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
    if (behavior.type === "RGB" || behavior.type === "HSL") {
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
      }
    }

    // Check if it's an FX type
    if (behavior.type === "dot" || behavior.type === "bar") {
      const fx = behavior as FX;

      switch (fx.type) {
        case "dot": {
          // Get current SVG string or initialize
          let currentSVG = "";
          if (outputData.type === "svg" && outputData.data) {
            currentSVG = outputData.data;
          }

          // Initialize SVG wrapper if empty (starting fresh)
          if (!currentSVG || currentSVG === "") {
            currentSVG = `<svg viewBox="0 0 ${source.width} ${source.height}" xmlns="http://www.w3.org/2000/svg">`;
          }

          const [updatedBehavior, updatedSVG, progress] = processDot(
            fx as FX & { type: "dot" },
            source,
            currentSVG
          );

          // Close SVG tag when complete
          let finalSVG = updatedSVG;
          if (progress >= 1 && !updatedSVG.includes("</svg>")) {
            finalSVG = updatedSVG + "</svg>";
          }

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "svg", data: finalSVG },
          };
        }
        case "bar": {
          // Get current SVG string or initialize
          let currentSVG = "";
          if (outputData.type === "svg" && outputData.data) {
            currentSVG = outputData.data;
          }

          // Initialize SVG wrapper if empty (starting fresh)
          if (!currentSVG || currentSVG === "") {
            currentSVG = `<svg viewBox="0 0 ${source.width} ${source.height}" xmlns="http://www.w3.org/2000/svg">`;
          }

          const [updatedBehavior, updatedSVG, progress] = processBar(
            fx as FX & { type: "bar" },
            source,
            currentSVG
          );

          // Close SVG tag when complete
          let finalSVG = updatedSVG;
          if (progress >= 1 && !updatedSVG.includes("</svg>")) {
            finalSVG = updatedSVG + "</svg>";
          }

          return {
            progress,
            behavior: updatedBehavior as T,
            outputData: { type: "svg", data: finalSVG },
          };
        }
      }
    }
  }

  throw Error("Unknown behavior type");
};
