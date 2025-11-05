export interface NumericalField {
  type: "Numerical";
  min: number;
  max: number;
  default: number;
  step: number;
}

export const newNumericalField = (): NumericalField => {
  throw new Error("Not Implemented");
};

export interface GradientField {
  type: "GradientMap";
  stops: { position: number; color: string };
  easing: "Linear" | "Constant";
}

export const newGradient = (): NumericalField => {
  throw new Error("Not Implemented");
};

type BehaviorField = NumericalField | GradientField;

export interface Behavior {
  type: string;
  fields: Record<string, BehaviorField>;
}
