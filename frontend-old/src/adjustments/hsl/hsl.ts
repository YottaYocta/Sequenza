import {
  type Behavior,
  type NumericalField,
  assertBehavior,
  newNumericalField,
} from "../../core/Behavior";
import { type Output, outputToImageData } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import {
  generateChunks,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../core/util";
import { cloneBehavior } from "../../core/Behavior";
import hslFragSource from "./hsl.frag?raw";

interface HSLBehavior extends Behavior {
  type: "hsl";
  fields: {
    h: NumericalField;
    s: NumericalField;
    l: NumericalField;
  };
}

export const createNewHSLBehavior = (h = 0, s = 0, l = 0): HSLBehavior => {
  return {
    type: "hsl",
    fields: {
      h: newNumericalField(-360, 360, h, 1),
      s: newNumericalField(-1, 1, s, 0.01),
      l: newNumericalField(-1, 1, l, 0.01),
    },
  };
};

/**
 * Convert RGB (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1)
 */
const rgbToHsl = (
  r: number,
  g: number,
  b: number
): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
};

/**
 * Convert HSL (H: 0-360, S: 0-1, L: 0-1) to RGB (0-255)
 */
const hslToRgb = (
  h: number,
  s: number,
  l: number
): [number, number, number] => {
  h = h / 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const HSLStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "hsl");
  const behaviorSnapshot = cloneBehavior(behavior) as HSLBehavior;

  const inputImageData = await outputToImageData(input);

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const hAdjust = behaviorSnapshot.fields.h.value;
  const sAdjust = behaviorSnapshot.fields.s.value;
  const lAdjust = behaviorSnapshot.fields.l.value;

  // Try WebGL rendering
  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    const vertexShaderSource = STANDARD_VERTEX_SHADER;

    const fragmentShaderSource = hslFragSource;
    const processStep = (program: WebGLProgram) => {
      const hslAdjustLocation = gl.getUniformLocation(program, "u_hslAdjust");
      gl.uniform3f(hslAdjustLocation, hAdjust, sAdjust, lAdjust);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
      gl.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        outputImageData.data
      );
    };

    runWithGLContext(
      gl,
      vertexShaderSource,
      fragmentShaderSource,
      inputImageData,
      processStep
    );

    return (): [number, Output] => {
      return [1, { type: "image", data: outputImageData }];
    };
  }

  // CPU fallback path
  // Define chunk size (e.g., 64x64 squares)
  const chunkSize = 64;
  const width = inputImageData.width;

  // Precompute list of chunks
  const chunks = generateChunks(inputImageData, chunkSize, chunkSize);
  const totalChunks = chunks.length;
  let currentChunkIndex = 0;

  // Return the step function closure
  return (): [number, Output] => {
    if (currentChunkIndex >= totalChunks) {
      // All chunks processed, return final output
      return [1, { type: "image", data: outputImageData }];
    }

    // Process current chunk
    const chunk = chunks[currentChunkIndex];
    const inputData = inputImageData.data;
    const outputData = outputImageData.data;

    for (let y = chunk.startY; y < chunk.endY; y++) {
      for (let x = chunk.startX; x < chunk.endX; x++) {
        const index = (y * width + x) * 4;

        // Get source pixel values
        const sourceR = inputData[index];
        const sourceG = inputData[index + 1];
        const sourceB = inputData[index + 2];
        const sourceA = inputData[index + 3];

        // Convert RGB to HSL
        let [h, s, l] = rgbToHsl(sourceR, sourceG, sourceB);

        // Apply HSL adjustments
        h = (h + hAdjust) % 360; // Hue wraps around
        if (h < 0) h += 360;
        s = Math.max(0, Math.min(1, s + sAdjust)); // Saturation clamped to 0-1
        l = Math.max(0, Math.min(1, l + lAdjust)); // Lightness clamped to 0-1

        // Convert back to RGB
        const [newR, newG, newB] = hslToRgb(h, s, l);

        // Write adjusted values
        outputData[index] = newR;
        outputData[index + 1] = newG;
        outputData[index + 2] = newB;
        outputData[index + 3] = sourceA; // Alpha unchanged
      }
    }

    currentChunkIndex++;
    const progress = currentChunkIndex / totalChunks;

    return [progress, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set("hsl", HSLStepFunctionFactory);
