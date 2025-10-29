import type { Adjustment } from "./Adjustment";
import type { FX } from "./FX";

export type Output =
  | { type: "image"; data: ImageData }
  | { type: "svg"; data: string };

export interface ProccessingNode<T extends Adjustment | FX> {
  progress: number;
  behavior: T;
  outputData: Output; // the output could either be another image or a string
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
  // TODO
  /**
   * should determine if FX or Adjustment, and then use switch to find fx/adjustment type
   *
   * then, should call a function specifically for that processing format. an example stub is provided in Adjustment.ts
   */
  throw Error("not implemented");
};
