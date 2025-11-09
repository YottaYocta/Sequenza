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
  step = 1,
  value = 0
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

export interface SelectionField {
  type: "SelectionField";
  options: string[];
  value: string;
}

export const newSelectionField = (
  values: string[],
  value: string
): SelectionField => {
  return {
    type: "SelectionField",
    options: [...values],
    value,
  };
};

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

type BehaviorField = NumericalField | GradientField | SelectionField;

export interface Behavior {
  type: string;
  fields: Record<string, BehaviorField>;
}

/**
 * Deep clones a Behavior object, handling Svelte proxy objects.
 * This function manually reconstructs the behavior to avoid issues with cloneBehavior on proxies.
 * @param behavior The behavior to clone
 * @returns A deep clone of the behavior
 */
export const cloneBehavior = <T extends Behavior>(behavior: T): T => {
  // Create a plain object by manually copying all properties
  const cloned: Behavior = {
    type: behavior.type,
    fields: {},
  };

  // Deep clone each field in the fields record
  for (const [fieldName, field] of Object.entries(behavior.fields)) {
    if (field.type === "Numerical") {
      cloned.fields[fieldName] = {
        type: field.type,
        min: field.min,
        max: field.max,
        default: field.default,
        step: field.step,
        value: field.value,
      };
    } else if (field.type === "GradientMap") {
      cloned.fields[fieldName] = {
        type: field.type,
        stops: field.stops.map((stop) => ({
          position: stop.position,
          color: stop.color,
        })),
        easing: field.easing,
      };
    } else if (field.type === "SelectionField") {
      cloned.fields[fieldName] = {
        type: "SelectionField",
        options: [...field.options],
        value: field.value,
      };
    }
  }

  return cloned as T;
};
