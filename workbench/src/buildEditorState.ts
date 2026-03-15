import type { Edge, Node } from "@xyflow/react";
import type { Patch, Uniforms } from "@sequenza/lib";
import type { ShaderNode } from "./components/ShaderNode";

export type EditorInitialState = {
  nodes: Node[];
  edges: Edge[];
  uniforms: Record<string, Uniforms>;
};

export function buildEditorState(
  patch: Patch,
  uniforms: Record<string, Uniforms>,
): EditorInitialState {
  const uniformRef = { current: uniforms };

  const nodes: ShaderNode[] = patch.shaders.map((shader, i) => ({
    id: shader.id,
    type: "shader",
    position: { x: 0, y: i * 200 },
    data: {
      shader,
      uniforms: uniformRef,
      resolution: [shader.resolution.width, shader.resolution.height] as [
        number,
        number,
      ],
      paused: false,
    },
  }));

  const edges: Edge[] = patch.connections.map((connection, i) => ({
    id: `edge-${i}`,
    source: connection.from,
    target: connection.to,
    targetHandle: connection.input,
    type: "insert",
  }));

  console.log("build", { nodes, edges, uniforms });

  return { nodes, edges, uniforms };
}
