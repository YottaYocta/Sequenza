import type { Shader } from "./renderer";

export type Field =
  | {
      name: string;
      type: "float";
      min?: number;
      max?: number;
      default?: number;
      special?: "time";
    }
  | {
      name: string;
      type: "vec2";
      default?: [number, number];
      special?: "mouse" | "resolution";
    }
  | {
      name: string;
      type: "vec3";
      default?: [number, number, number];
      color?: true;
    }
  | {
      name: string;
      type: "vec4";
      default?: [number, number, number, number];
      color?: true;
    }
  | {
      name: string;
      type: "sampler2D";
      source: "input" | "texture" | "gradient";
    };

// uniform vec3 varname; // color
// uniform vec3 varname; // color [r, g, b]
// uniform vec4 varname; // color
// uniform vec4 varname; // color [r, g, b, a]
// uniform float var; // time (if this, create an input component that looks like ([start/stop - changes by ui state] / timevalue), with timevalue being time elapsed in seconds. use the time context from the editor)
// uniform vec2 varname; // mouse (if this, create a readonly component that monitors position of the mouse; does this by using the mouse context from the editor)
// uniform sampler2D varname; // texture

/**
 * Parses shader source for uniform declarations with metadata comments.
 *
 * Supported formats:
 *   uniform float var;
 *   uniform vec2 var;
 *   uniform vec3 var;
 *   uniform vec4 var;
 */
const NUM = "([-\\d.]+)";
const SEP = "\\s*,\\s*";

export const extractFields = (shader: Shader): Field[] => {
  const fields: Field[] = [];
  const lines = shader.source.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // uniform float name; // [min, max, default]
    const floatMeta = trimmed.match(
      new RegExp(
        `^uniform\\s+float\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`,
      ),
    );
    if (floatMeta?.[1]) {
      const min = parseFloat(floatMeta[2]);
      const max = parseFloat(floatMeta[3]);
      const def = parseFloat(floatMeta[4]);
      fields.push({
        name: floatMeta[1],
        type: "float",
        min,
        max,
        default: def,
      });
      continue;
    }

    const floatTime = trimmed.match(
      /^uniform\s+float\s+(\w+)\s*;.*\/\/\s*time\b/,
    );
    if (floatTime?.[1]) {
      fields.push({ name: floatTime[1], type: "float", special: "time" });
      continue;
    }

    const floatMatch = trimmed.match(/^uniform\s+float\s+(\w+)\s*;/);
    if (floatMatch?.[1]) {
      fields.push({ name: floatMatch[1], type: "float" });
      continue;
    }

    // uniform vec2 name; // [x, y]
    const vec2Meta = trimmed.match(
      new RegExp(
        `^uniform\\s+vec2\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}\\s*\\]`,
      ),
    );
    if (vec2Meta?.[1]) {
      const def: [number, number] = [
        parseFloat(vec2Meta[2]),
        parseFloat(vec2Meta[3]),
      ];
      fields.push({ name: vec2Meta[1], type: "vec2", default: def });
      continue;
    }

    // uniform vec3 name; // color [r, g, b]
    const vec3Color = trimmed.match(
      new RegExp(
        `^uniform\\s+vec3\\s+(\\w+)\\s*;.*\\/\\/\\s*color(?:\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\])?`,
      ),
    );
    if (vec3Color?.[1]) {
      const def: [number, number, number] | undefined =
        vec3Color[2] !== undefined
          ? [
              parseFloat(vec3Color[2]),
              parseFloat(vec3Color[3]),
              parseFloat(vec3Color[4]),
            ]
          : undefined;
      fields.push({
        name: vec3Color[1],
        type: "vec3",
        color: true,
        ...(def && { default: def }),
      });
      continue;
    }

    // uniform vec3 name; // [x, y, z]
    const vec3Meta = trimmed.match(
      new RegExp(
        `^uniform\\s+vec3\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`,
      ),
    );
    if (vec3Meta?.[1]) {
      const def: [number, number, number] = [
        parseFloat(vec3Meta[2]),
        parseFloat(vec3Meta[3]),
        parseFloat(vec3Meta[4]),
      ];
      fields.push({ name: vec3Meta[1], type: "vec3", default: def });
      continue;
    }

    // uniform vec4 name; // color [r, g, b, a]
    const vec4Color = trimmed.match(
      new RegExp(
        `^uniform\\s+vec4\\s+(\\w+)\\s*;.*\\/\\/\\s*color(?:\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\])?`,
      ),
    );
    if (vec4Color?.[1]) {
      const def: [number, number, number, number] | undefined =
        vec4Color[2] !== undefined
          ? [
              parseFloat(vec4Color[2]),
              parseFloat(vec4Color[3]),
              parseFloat(vec4Color[4]),
              parseFloat(vec4Color[5]),
            ]
          : undefined;
      fields.push({
        name: vec4Color[1],
        type: "vec4",
        color: true,
        ...(def && { default: def }),
      });
      continue;
    }

    // uniform vec4 name; // [x, y, z, w]
    const vec4Meta = trimmed.match(
      new RegExp(
        `^uniform\\s+vec4\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`,
      ),
    );
    if (vec4Meta?.[1]) {
      const def: [number, number, number, number] = [
        parseFloat(vec4Meta[2]),
        parseFloat(vec4Meta[3]),
        parseFloat(vec4Meta[4]),
        parseFloat(vec4Meta[5]),
      ];
      fields.push({ name: vec4Meta[1], type: "vec4", default: def });
      continue;
    }

    const vec2Mouse = trimmed.match(
      /^uniform\s+vec2\s+(\w+)\s*;.*\/\/\s*mouse\b/,
    );
    if (vec2Mouse?.[1]) {
      fields.push({ name: vec2Mouse[1], type: "vec2", special: "mouse" });
      continue;
    }

    const vec2Resolution = trimmed.match(
      /^uniform\s+vec2\s+(\w+)\s*;.*\/\/\s*resolution\b/,
    );
    if (vec2Resolution?.[1]) {
      fields.push({ name: vec2Resolution[1], type: "vec2", special: "resolution" });
      continue;
    }

    const vecMatch = trimmed.match(/^uniform\s+(vec[234])\s+(\w+)\s*;/);
    if (vecMatch) {
      const vecType = vecMatch[1] as "vec2" | "vec3" | "vec4";
      const name = vecMatch[2];
      if (vecType === "vec2") fields.push({ name, type: "vec2" });
      else if (vecType === "vec3") fields.push({ name, type: "vec3" });
      else if (vecType === "vec4") fields.push({ name, type: "vec4" });
      continue;
    }

    const sampler2DMatch = trimmed.match(
      /^uniform\s+sampler2D\s+(\w+)\s*;(?:.*\/\/\s*(texture|gradient)\b)?/,
    );
    if (sampler2DMatch?.[1]) {
      const comment = sampler2DMatch[2];
      const source =
        comment === "texture"
          ? "texture"
          : comment === "gradient"
            ? "gradient"
            : "input";
      fields.push({
        name: sampler2DMatch[1],
        type: "sampler2D",
        source,
      });
    }
  }

  return fields;
};

export function typeMatchesField(value: unknown, field: Field): boolean {
  switch (field.type) {
    case "float":
      return typeof value === "number";
    case "vec2":
      return Array.isArray(value) && value.length === 2;
    case "vec3":
      return Array.isArray(value) && value.length === 3;
    case "vec4":
      return Array.isArray(value) && value.length === 4;
    case "sampler2D":
      if (field.source === "gradient")
        return (value as any)?.type === "gradient";
      if (field.source === "texture")
        return (value as any)?.type === "texture";
      return false;
  }
}

export function getFieldDefault(
  field: Field,
): number | number[] | undefined {
  if (field.type === "float") return field.default;
  if (field.type === "vec2") return field.default;
  if (field.type === "vec3") return field.default;
  if (field.type === "vec4") return field.default;
  return undefined;
}
