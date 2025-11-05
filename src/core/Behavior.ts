export interface NumericalField {
  type: "Numerical";
  min: number;
  max: number;
  default: number;
  step: number;
  value: number;
}

export const newNumericalField = (
  min = 0,
  max = 100,
  defaultValue = 0,
  step = 1
): NumericalField => {
  return {
    type: "Numerical",
    min,
    max,
    default: defaultValue,
    step,
    value: defaultValue,
  };
};

export interface GradientField {
  type: "GradientMap";
  stops: { position: number; color: string }[];
  easing: "Linear" | "Constant";
}

export const newGradient = (
  stops: { position: number; color: string }[] = [
    { position: 0, color: "#000000" },
    { position: 1, color: "#ffffff" },
  ],
  easing: "Linear" | "Constant" = "Linear"
): GradientField => {
  for (const stop of stops) {
    if (stop.position < 0 || stop.position > 1) {
      throw new Error(
        `Gradient stop position must be in range 0-1, got ${stop.position}`
      );
    }
  }
  return {
    type: "GradientMap",
    stops: stops,
    easing,
  };
};

type BehaviorField = NumericalField | GradientField;

export interface Behavior {
  type: string;
  fields: Record<string, BehaviorField>;
}
