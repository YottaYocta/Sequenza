import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
  type Behavior,
  type ColorField,
  type NumericalField,
} from "../../core/Behavior";
import { outputToImageData, type Output } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import { hexToRGBA, STANDARD_VERTEX_SHADER } from "../../core/util";

import chromaFragShader from "./chromakey.frag?raw";

interface ChromaKeyBehavior extends Behavior {
  type: "chromakey";
  fields: {
    sourceColor: ColorField;
    targetColor: ColorField;
    threshold: NumericalField;
  };
}

export const createChromaKeyBehavior = (
  sourceColor = "#ffffffff",
  targetColor = "#ffffffff"
): ChromaKeyBehavior => {
  return {
    type: "chromakey",
    fields: {
      sourceColor: {
        type: "ColorField",
        value: sourceColor,
      },
      targetColor: {
        type: "ColorField",
        value: targetColor,
      },
      threshold: newNumericalField(0, 1, 0.01, 0.001, 0.01),
    },
  };
};

const ChromaKeyStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "chromakey");
  const behaviorSnapshot = cloneBehavior(behavior) as ChromaKeyBehavior;

  const chromaKeyBehavior = cloneBehavior<ChromaKeyBehavior>(
    behavior as ChromaKeyBehavior
  );

  const inputImage = await outputToImageData(input);
  const outputImage = new ImageData(inputImage.width, inputImage.height);

  // webgl rendering

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = inputImage.width;
  canvas.height = inputImage.height;

  const stepFunction: StepFunction = () => {
    const gl = canvas.getContext("webgl");
    if (gl != null) {
      const fragSource = chromaFragShader;

      try {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

        gl.shaderSource(vertexShader, STANDARD_VERTEX_SHADER);
        gl.shaderSource(fragmentShader, fragSource);

        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

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

        const texCoords = new Float32Array([
          0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
        ]);

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
          inputImage
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const sourceColorLocation = gl.getUniformLocation(
          program,
          "u_sourceColor"
        );
        const [sr, sg, sb] = hexToRGBA(
          chromaKeyBehavior.fields.sourceColor.value
        );
        gl.uniform3f(sourceColorLocation, sr / 255, sg / 255, sb / 255);

        const targetColorLocation = gl.getUniformLocation(
          program,
          "u_targetColor"
        );
        const [tr, tg, tb, ta] = hexToRGBA(
          chromaKeyBehavior.fields.targetColor.value
        );
        gl.uniform4f(
          targetColorLocation,
          tr / 255,
          tg / 255,
          tb / 255,
          ta / 255
        );

        const thresholdLocation = gl.getUniformLocation(program, "u_threshold");
        gl.uniform1f(
          thresholdLocation,
          chromaKeyBehavior.fields.threshold.value
        );

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
          outputImage.data
        );

        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texCoordBuffer);
        gl.deleteTexture(texture);
        gl.deleteProgram(program);
      } catch (e: unknown) {
        throw new Error("" + e);
      }
    }
    return [1, { type: "image", data: outputImage }];
  };
  return stepFunction;
};

GlobalStepFunctionFactoryRegistry.set(
  "chromakey",
  ChromaKeyStepFunctionFactory
);
