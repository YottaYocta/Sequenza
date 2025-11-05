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
