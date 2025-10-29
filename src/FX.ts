export type MidPassFilter = {
  // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
  low: number;
  high: number;
};

interface DotFX {
  type: "dot";
  offsetX: number;
  offsetY: number;
  dotRadius: number;
  gapX: number; // horizontal separation
  gapY: number; // vertical separation
  borderRadius: number; // clamped to -1 to 1, with 0 being no corners (creates pixels) and 1 being equal to the dotRadius (fully rounded). -1 corresponds to a star shape (four pointed star; a circle but with edges concave, leaving 4 points)
  // controls the rotation of each Dot individually
  rotation: number;
  filter: MidPassFilter;
}

export type FX = DotFX;

export const newFX = (type: "dot"): FX => {
  // TODO not implemented yet
  throw Error("not implemented yet");
};
