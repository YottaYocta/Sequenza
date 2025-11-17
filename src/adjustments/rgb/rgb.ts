import {
  type Behavior,
  type NumericalField,
  newNumericalField,
} from "../../core/Behavior";
import { type Output, outputToImageData } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import { generateChunks } from "../../core/util";
import { cloneBehavior } from "../../core/Behavior";
import rgbFragSource from "./rgb.frag?raw";

interface RGBBehavior extends Behavior {
  type: "rgb";
  fields: {
    r: NumericalField;
    g: NumericalField;
    b: NumericalField;
  };
}

export const createNewRGBBehavior = (r = 0, g = 0, b = 0): RGBBehavior => {
  return {
    type: "rgb",
    fields: {
      r: newNumericalField(-255, 255, r, 1),
      g: newNumericalField(-255, 255, g, 1),
      b: newNumericalField(-255, 255, b, 1),
    },
  };
};

const RGBStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  // Assert behavior is RGB type
  if (behavior.type !== "rgb") {
    throw new Error(
      `RGB factory requires behavior type "rgb", got "${behavior.type}"`
    );
  }

  const inputImageData = await outputToImageData(input);

  const behaviorSnapshot = cloneBehavior(behavior) as RGBBehavior;

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const rAdjust = behaviorSnapshot.fields.r.value;
  const gAdjust = behaviorSnapshot.fields.g.value;
  const bAdjust = behaviorSnapshot.fields.b.value;

  // Try WebGL rendering
  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    try {
      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;

        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;

      const fragmentShaderSource = rgbFragSource;

      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      // Create program
      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);

      const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

      const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        inputImageData
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const rgbAdjustLocation = gl.getUniformLocation(program, "u_rgbAdjust");
      gl.uniform3f(rgbAdjustLocation, rAdjust, gAdjust, bAdjust);

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

      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(texCoordBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);

      return (): [number, Output] => {
        return [1, { type: "image", data: outputImageData }];
      };
    } catch (error) {
      // WebGL failed, fall through to CPU path
      console.warn("WebGL rendering failed, falling back to CPU:", error);
    }
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

        // Apply RGB adjustments
        outputData[index] = Math.max(
          0,
          Math.min(255, inputData[index] + rAdjust)
        );
        outputData[index + 1] = Math.max(
          0,
          Math.min(255, inputData[index + 1] + gAdjust)
        );
        outputData[index + 2] = Math.max(
          0,
          Math.min(255, inputData[index + 2] + bAdjust)
        );
        outputData[index + 3] = inputData[index + 3]; // Alpha unchanged
      }
    }

    currentChunkIndex++;
    const progress = currentChunkIndex / totalChunks;

    return [progress, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set("rgb", RGBStepFunctionFactory);
