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
