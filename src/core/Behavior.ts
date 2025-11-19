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

export type Color = string;

export interface GradientStop {
  position: number;
  color: Color;
}

export interface GradientField {
  type: "GradientMap";
  stops: GradientStop[];
  easing: "Linear" | "Constant";
}

export interface ColorField {
  type: "ColorField";
  value: Color;
}

export interface SelectionField {
  type: "SelectionField";
  options: string[];
  value: string;
}

export type FieldCollection = Record<string, BehaviorField>;

export interface SwitchField {
  type: "SwitchField";
  currentField: string;
  switchFields: Record<string, FieldCollection>; // maps switch option name to list of fields associated with that field
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
    { position: 0, color: "#000000ff" },
    { position: 1, color: "#ffffffff" },
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

export type ValueField =
  | NumericalField
  | GradientField
  | SelectionField
  | ColorField;

export type BehaviorField = ValueField | SwitchField;

export interface Behavior {
  type: string;
  fields: Record<string, BehaviorField>;
}

/**
 * Deep clones a BehaviorField, handling all field types recursively.
 */
const cloneField = (field: BehaviorField): BehaviorField => {
  if (field.type === "Numerical") {
    return {
      type: field.type,
      min: field.min,
      max: field.max,
      default: field.default,
      step: field.step,
      value: field.value,
    };
  } else if (field.type === "GradientMap") {
    return {
      type: field.type,
      stops: field.stops.map((stop) => ({
        position: stop.position,
        color: stop.color,
      })),
      easing: field.easing,
    };
  } else if (field.type === "SelectionField") {
    return {
      type: "SelectionField",
      options: [...field.options],
      value: field.value,
    };
  } else if (field.type === "SwitchField") {
    const clonedSwitchFields: Record<string, FieldCollection> = {};

    for (const [switchKey, switchOptions] of Object.entries(
      field.switchFields
    )) {
      clonedSwitchFields[switchKey] = {};
      for (const [optionKey, field] of Object.entries(switchOptions)) {
        clonedSwitchFields[switchKey][optionKey] = cloneField(field);
      }
    }

    return {
      type: "SwitchField",
      currentField: field.currentField,
      switchFields: clonedSwitchFields,
    };
  } else if (field.type === "ColorField") {
    return {
      type: "ColorField",
      value: field.value,
    };
  }
  throw new Error(`Unknown field type: ${(field as any).type}`);
};

/**
 * Deep clones a Behavior object, handling Svelte proxy objects.
 * This function manually reconstructs the behavior to avoid issues with cloneBehavior on proxies.
 * @param behavior The behavior to clone
 * @returns A deep clone of the behavior
 */
export const cloneBehavior = <T extends Behavior>(behavior: T): T => {
  const cloned: Behavior = {
    type: behavior.type,
    fields: {},
  };

  // Deep clone each field in the fields record
  for (const [fieldName, field] of Object.entries(behavior.fields)) {
    cloned.fields[fieldName] = cloneField(field);
  }

  return cloned as T;
};

/**
 *
 * @template T type to assert that behavior is
 * @param behavior
 * @param type type to ensure that behavior is
 * @returns true if behavior's type matches type specified
 */
export const assertBehavior = <T extends Behavior>(
  behavior: Behavior,
  type: string
): behavior is T => {
  if (behavior.type !== type) {
    return false;
  }
  return true;
};

export const throwStepFunctionFactoryError = (
  expectedType: string,
  receivedType: string
): never => {
  throw new Error(
    `step function expected behavior of type ${expectedType} but got ${receivedType}`
  );
};
