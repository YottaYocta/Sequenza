import { create, all } from "mathjs";

const math = create(all);

export type EvalContext = {
  time: number;
  mouse: [number, number];
  resolution: [number, number];
};

export function evalExpression(expr: string, ctx: EvalContext): number | null {
  try {
    const result = math.evaluate(expr, {
      time: ctx.time,
      mouse: { x: ctx.mouse[0], y: ctx.mouse[1] },
      resolution: { x: ctx.resolution[0], y: ctx.resolution[1] },
    });
    return typeof result === "number" ? result : null;
  } catch {
    return null;
  }
}

