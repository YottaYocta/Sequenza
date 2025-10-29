/**
 * Performs linear interpolation between two numbers.
 *
 * @param a The starting value.
 * @param b The ending value.
 * @param t The interpolation factor, typically between 0 and 1.
 *          If t is 0, the result is 'a'.
 *          If t is 1, the result is 'b'.
 *          If t is between 0 and 1, the result is a value between 'a' and 'b'.
 *          Values of t outside [0, 1] will result in extrapolation.
 * @returns The interpolated value.
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};
