import type {
  Behavior,
  ColorField,
  NumericalField,
  SwitchField,
} from "../../core/Behavior";
import {
  assertBehavior,
  cloneBehavior,
  newNumericalField,
} from "../../core/Behavior";
import { outputToImageData, type Output } from "../../core/Output";
import {
  GlobalStepFunctionFactoryRegistry,
  type StepFunction,
  type StepFunctionFactory,
} from "../../core/ProcessingUnit";
import {
  hexToRGBA,
  runWithGLContext,
  STANDARD_VERTEX_SHADER,
} from "../../core/util";
import linesFragSource from "./lines.frag?raw";

interface LinesSwitchBehavior extends SwitchField {
  switchFields: {
    dynamicColor: {}; // sampling color at each pixel
    singleColor: {
      color: ColorField;
    };
  };
}

interface LinesBehavior extends Behavior {
  type: "lines";
  fields: {
    rotation: NumericalField;
    density: NumericalField; // higher density = more lines
    colorMode: LinesSwitchBehavior;
  };
}

export const createLinesBehavior = (): LinesBehavior => {
  return {
    type: "lines",
    fields: {
      rotation: newNumericalField(0, 360, 0, 1, 0),
      density: newNumericalField(1, 100, 10, 1, 10),
      colorMode: {
        type: "SwitchField",
        currentField: "dynamicColor",
        switchFields: {
          dynamicColor: {},
          singleColor: {
            color: {
              type: "ColorField",
              value: "#000000ff",
            },
          },
        },
      },
    },
  };
};

const linesBehaviorStepFunctionFactory: StepFunctionFactory = async (
  input: Output,
  behavior: Behavior
): Promise<StepFunction> => {
  assertBehavior(behavior, "lines");
  const behaviorSnapshot = cloneBehavior(behavior) as LinesBehavior;

  const inputImageData = await outputToImageData(input);

  const outputImageData = new ImageData(
    inputImageData.width,
    inputImageData.height
  );

  const rotation = behaviorSnapshot.fields.rotation.value;
  const density = behaviorSnapshot.fields.density.value;
  const colorMode = behaviorSnapshot.fields.colorMode.currentField;

  // Get color value if in singleColor mode
  let singleColor = "#000000ff";
  if (colorMode === "singleColor") {
    singleColor =
      behaviorSnapshot.fields.colorMode.switchFields.singleColor.color.value;
  }

  // Try WebGL rendering
  const canvas = document.createElement("canvas");
  canvas.width = inputImageData.width;
  canvas.height = inputImageData.height;
  const gl = canvas.getContext("webgl");

  if (gl) {
    const processStep = (program: WebGLProgram) => {
      // Set uniforms
      const rotationLocation = gl.getUniformLocation(program, "u_rotation");
      gl.uniform1f(rotationLocation, (rotation / 180) * Math.PI);

      const densityLocation = gl.getUniformLocation(program, "u_density");
      gl.uniform1f(densityLocation, density);

      const colorModeLocation = gl.getUniformLocation(program, "u_colorMode");
      // 0.0 for dynamicColor, 1.0 for singleColor
      gl.uniform1f(colorModeLocation, colorMode === "singleColor" ? 1.0 : 0.0);

      const textureLocation = gl.getUniformLocation(program, "u_texture");
      gl.uniform1i(textureLocation, 0);

      const singleColorLocation = gl.getUniformLocation(
        program,
        "u_singleColor"
      );
      gl.uniform4fv(
        singleColorLocation,
        hexToRGBA(singleColor).map((channel) => channel / 255)
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
        outputImageData.data
      );
    };

    runWithGLContext(
      gl,
      STANDARD_VERTEX_SHADER,
      linesFragSource,
      inputImageData,
      processStep
    );

    return (): [number, Output] => {
      return [1, { type: "image", data: outputImageData }];
    };
  }

  // CPU fallback - just copy the input for now
  outputImageData.data.set(new Uint8ClampedArray(inputImageData.data));
  return (): [number, Output] => {
    return [1, { type: "image", data: outputImageData }];
  };
};

GlobalStepFunctionFactoryRegistry.set(
  "lines",
  linesBehaviorStepFunctionFactory
);
