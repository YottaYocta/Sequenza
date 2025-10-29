export type MidPassFilter = {
  // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
  low: number;
  high: number;
};

interface DotFX {
  type: "dot";
  horizontalCount: number;
  verticalCount: number;
  dotRadius: number;
  borderRadius: number; // clamped to -1 to 1, with 0 being no corners (creates pixels) and 1 being equal to the dotRadius (fully rounded). -1 corresponds to a star shape (four pointed star; a circle but with edges concave, leaving 4 points)
  // controls the rotation of each Dot individually
  rotation: number;
  filter: MidPassFilter;
  nextRow: number; // which row to process next (0 to verticalCount-1)
}

export type FX = DotFX;

export const newFX = (type: "dot"): FX => {
  switch (type) {
    case "dot":
      return {
        type: "dot",
        horizontalCount: 10,
        verticalCount: 10,
        dotRadius: 5,
        borderRadius: 1,
        rotation: 0,
        filter: {
          low: 0,
          high: 1,
        },
        nextRow: 0,
      };
  }
};
