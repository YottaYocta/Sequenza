import {
  type Behavior,
  type GradientField,
  assertBehavior,
  newGradient,
} from "../../Behavior";
import { type Output, outputToImageData } from "../../Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../ProcessingUnit";
import {
  generateChunks,
  hexToRGBA,
  interpolateColors,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../util";
import { cloneBehavior } from "../../Behavior";
import gradientMapFragSource from "./gradientmap.frag?raw";

interface GradientMapBehavior extends Behavior {
  type: "gradientmap";
  fields: {
    gradient: GradientField;
  };
}

export const createNewGradientMapBehavior = (
  stops: { position: number; color: string }[] = [
    { position: 0, color: "#000000ff" },
    { position: 1, color: "#ffffffff" },
  ],
  easing: "Linear" | "Constant" = "Linear"
): GradientMapBehavior => {
  return {
    type: "gradientmap",
    fields: {
      gradient: newGradient(stops, easing),
    },
  };
};

/**
 * Evaluates the gradient at a given progress value (0-1)
 */
export const evalGradientAt = (
  gradient: GradientField,
  progress: number
): string => {
  const { stops, easing } = gradient;

  const clampedProgress = Math.max(0, Math.min(1, progress));

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  // edge cases
  if (sortedStops.length === 0) {
    return "#000000"; // Default to black if no stops
  }
  if (sortedStops.length === 1) {
    return sortedStops[0].color;
  }

  // return if to left/right of edge color
  if (clampedProgress <= sortedStops[0].position) {
    return sortedStops[0].color;
  }

  if (clampedProgress >= sortedStops[sortedStops.length - 1].position) {
    return sortedStops[sortedStops.length - 1].color;
  }

  // Find the bracketing stops
  let lowerStop = sortedStops[0];
  let upperStop = sortedStops[sortedStops.length - 1];

  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (
      clampedProgress >= sortedStops[i].position &&
      clampedProgress <= sortedStops[i + 1].position
    ) {
      lowerStop = sortedStops[i];
      upperStop = sortedStops[i + 1];
      break;
    }
  }

  const range = upperStop.position - lowerStop.position;
  const localT =
    range === 0 ? 0 : (clampedProgress - lowerStop.position) / range;

  if (easing === "Constant") {
    return lowerStop.color;
  } else {
    return interpolateColors(lowerStop.color, upperStop.color, localT);
  }
};

const GradientMapStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "gradientmap");
  const behaviorSnapshot = cloneBehavior(behavior) as GradientMapBehavior;

  const inputImageData = await outputToImageData(input);

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const gradient = behaviorSnapshot.fields.gradient;

  // Try WebGL rendering
  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    const processStep = (program: WebGLProgram) => {
      // Create gradient lookup texture (1D gradient stored as 2D texture)
      const gradientSize = 256;
      const gradientData = new Uint8Array(gradientSize * 4);

      for (let i = 0; i < gradientSize; i++) {
        const t = i / (gradientSize - 1);
        const color = evalGradientAt(gradient, t);
        const [r, g, b, a] = hexToRGBA(color);
        gradientData[i * 4] = r;
        gradientData[i * 4 + 1] = g;
        gradientData[i * 4 + 2] = b;
        gradientData[i * 4 + 3] = a;
      }

      const gradientTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, gradientTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gradientSize,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        gradientData
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const textureLocation = gl.getUniformLocation(program, "u_texture");
      gl.uniform1i(textureLocation, 0);

      const gradientTextureLocation = gl.getUniformLocation(
        program,
        "u_gradientTexture"
      );
      gl.uniform1i(gradientTextureLocation, 1);

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
      STANDARD_VERTEX_SHADER,
      gradientMapFragSource,
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
        const r = inputData[index];
        const g = inputData[index + 1];
        const b = inputData[index + 2];
        const a = inputData[index + 3];

        // Calculate brightness/luminance of the pixel (0-1)
        // Using relative luminance formula (perceived brightness)
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Get the gradient color at this brightness level
        const gradientColor = evalGradientAt(gradient, brightness);

        // Parse the gradient color
        const [newR, newG, newB] = hexToRGBA(gradientColor);

        // Write the mapped color to output
        outputData[index] = newR;
        outputData[index + 1] = newG;
        outputData[index + 2] = newB;
        outputData[index + 3] = a; // Preserve alpha channel
      }
    }

    currentChunkIndex++;
    const progress = currentChunkIndex / totalChunks;

    return [progress, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set(
  "gradientmap",
  GradientMapStepFunctionFactory
);
