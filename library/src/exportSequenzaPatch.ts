import templateContent from "./assets/SequenzaComponent.tsx?raw";
import type { Patch, Uniforms } from "./renderer";
import { topologicalSort } from "./utils/topologicalSort";

export function exportSequenzaPatch(
  uniforms: Record<string, Uniforms>,
  patch: Patch,
): string {
  let content = templateContent;

  const filteredUniformKeys = Object.keys(uniforms).filter((key) =>
    patch.shaders.some((shader) => shader.id === key),
  );

  const filteredUniforms: Record<string, Uniforms> = {};
  for (const key of filteredUniformKeys) {
    filteredUniforms[key] = uniforms[key];
  }

  content = content.replace(
    `throw new Error("placeholder for initial uniforms");`,
    `return ${JSON.stringify(filteredUniforms, null, 2)};`,
  );

  content = content.replace(
    `throw new Error("placeholder for patch");`,
    `return ${JSON.stringify(patch, null, 2)};`,
  );

  const sorted = topologicalSort(patch);
  const outputShader = sorted[sorted.length - 1];
  if (outputShader) {
    content = content.replace(
      `100\n        // final patch width`,
      String(outputShader.resolution.width),
    );
    content = content.replace(
      `100\n        // final patch height`,
      String(outputShader.resolution.height),
    );
  }

  return content;
}
