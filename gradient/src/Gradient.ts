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

const isSerializedGradient = (v: unknown): v is SerializedGradient =>
  typeof v === "object" &&
  v !== null &&
  (v as SerializedGradient).type === "gradient" &&
  Array.isArray((v as SerializedGradient).stops);

export class Gradient {
  readonly type = "texture" as const;
  readonly canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _stops: GradientStop[];

  constructor(stops: GradientStop[] = DEFAULT_STOPS) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 1;
    this._ctx = this.canvas.getContext("2d")!;
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
    if (isSerializedGradient(value)) return new Gradient(value.stops);
    return new Gradient();
  }

  private _paint(): void {
    console.log("[Gradient] _paint");
    const sorted = [...this._stops]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ position: s.position, rgb: hexToRgb(s.color) }));
    const image = this._ctx.createImageData(256, 1);
    const data = image.data;
    let lo = 0;
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let r: number, g: number, b: number;
      if (sorted.length === 0) {
        r = g = b = 0;
      } else if (sorted.length === 1 || t <= sorted[0].position) {
        [r, g, b] = sorted[0].rgb;
      } else if (t >= sorted[sorted.length - 1].position) {
        [r, g, b] = sorted[sorted.length - 1].rgb;
      } else {
        while (lo < sorted.length - 2 && t > sorted[lo + 1].position) lo++;
        const a = sorted[lo],
          c = sorted[lo + 1];
        const range = c.position - a.position;
        const localT = range === 0 ? 0 : (t - a.position) / range;
        r = Math.round(a.rgb[0] + (c.rgb[0] - a.rgb[0]) * localT);
        g = Math.round(a.rgb[1] + (c.rgb[1] - a.rgb[1]) * localT);
        b = Math.round(a.rgb[2] + (c.rgb[2] - a.rgb[2]) * localT);
      }
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
    this._ctx.putImageData(image, 0, 0);
  }
}

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
