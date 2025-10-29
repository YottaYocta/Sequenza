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
  switch (type) {
    case "dot":
      return {
        type: "dot",
        offsetX: 0,
        offsetY: 0,
        dotRadius: 5,
        gapX: 10,
        gapY: 10,
        borderRadius: 1,
        rotation: 0,
        filter: {
          low: 0,
          high: 1,
        },
      };
  }
};
