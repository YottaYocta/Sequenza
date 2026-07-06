export type GradientStop = { position: number; color: string };

export type SerializedGradient = { type: "gradient"; stops: GradientStop[] };

const DEFAULT_STOPS: GradientStop[] = [
  { position: 0, color: "#000000" },
  { position: 1, color: "#ffffff" },
];

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const interpolateHex = (c1: string, c2: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(g1 + (g2 - g1) * t)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(b1 + (b2 - b1) * t)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
};

export const evalGradientAt = (stops: GradientStop[], t: number): string => {
  const clamped = Math.max(0, Math.min(1, t));
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return "#000000";
  if (sorted.length === 1) return sorted[0].color;
  if (clamped <= sorted[0].position) return sorted[0].color;
  if (clamped >= sorted[sorted.length - 1].position)
    return sorted[sorted.length - 1].color;
  let lower = sorted[0],
    upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (clamped >= sorted[i].position && clamped <= sorted[i + 1].position) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }
  const range = upper.position - lower.position;
  const localT = range === 0 ? 0 : (clamped - lower.position) / range;
  return interpolateHex(lower.color, upper.color, localT);
};

// The `canvas` reference is stable across `setStops`; the renderer relies on
// this to pick up new pixels via in-place repaint without re-binding a texture.
export class Gradient {
  readonly type = "texture" as const;
  readonly canvas: HTMLCanvasElement;
  private _stops: GradientStop[];

  constructor(stops: GradientStop[] = DEFAULT_STOPS) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 1;
    this._stops = stops;
    this._paint();
  }

  get src(): HTMLCanvasElement {
    return this.canvas;
  }

  get stops(): GradientStop[] {
    return this._stops;
  }

  setStops(stops: GradientStop[]): void {
    this._stops = stops;
    this._paint();
  }

  toJSON(): SerializedGradient {
    return { type: "gradient", stops: this._stops };
  }

  static fromJSON(value: unknown): Gradient {
    if (value instanceof Gradient) return value;
    if (Array.isArray(value)) return new Gradient(value as GradientStop[]);
    if (
      typeof value === "object" &&
      value !== null &&
      (value as SerializedGradient).type === "gradient" &&
      Array.isArray((value as SerializedGradient).stops)
    ) {
      return new Gradient((value as SerializedGradient).stops);
    }
    return new Gradient();
  }

  private _paint(): void {
    const ctx = this.canvas.getContext("2d")!;
    for (let i = 0; i < 256; i++) {
      ctx.fillStyle = evalGradientAt(this._stops, i / 255);
      ctx.fillRect(i, 0, 1, 1);
    }
  }
}

const isSerializedGradient = (v: unknown): v is SerializedGradient =>
  typeof v === "object" &&
  v !== null &&
  (v as SerializedGradient).type === "gradient" &&
  Array.isArray((v as SerializedGradient).stops);

// Idempotent: callers (workbench init, RendererComponent effect) may invoke
// this on already-hydrated uniforms without producing new Gradient instances.
export const hydrateGradientUniforms = <T extends Record<string, any>>(
  uniforms: T,
): T => {
  for (const shaderKey of Object.keys(uniforms)) {
    const shaderUniforms = uniforms[shaderKey];
    if (typeof shaderUniforms !== "object" || shaderUniforms === null) continue;
    for (const key of Object.keys(shaderUniforms)) {
      const v = (shaderUniforms as Record<string, unknown>)[key];
      if (isSerializedGradient(v)) {
        (shaderUniforms as Record<string, unknown>)[key] = new Gradient(
          v.stops,
        );
      }
    }
  }
  return uniforms;
};
