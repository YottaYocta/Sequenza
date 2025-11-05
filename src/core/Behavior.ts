interface NumericalField {
  type: "Numerical";
  min: number;
  max: number;
  default: number;
  step: number;
}
interface GradientField {
  type: "GradientMap";
  stops: { position: number; color: string };
  easing: "Linear" | "Constant";
}

type BehaviorField = NumericalField | GradientField;

export interface Behavior {
  type: string;
  fields: Record<string, BehaviorField>;
}
