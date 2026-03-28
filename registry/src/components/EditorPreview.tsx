import { useMemo, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Shader, Uniforms } from "@sequenza/lib";
import { Editor, ShaderNode } from "@sequenza/workbench";

export type EditorPreviewProps = {
  source: string;
};

export function EditorPreview({ source }: EditorPreviewProps) {
  console.log(source);
  const uniformsRef = useRef<Record<string, Uniforms>>({
    "35514.33495797567": {
      resolution: [200, 200],
      scale: 1,
      u_image_source: {
        type: "texture",
        src: source,
      },
    },
    "46700.951879366534": {
      u_frequency: 26.16,
      u_radius: 0.9,
      u_rotation: 0.43,
      u_constantSize: 0,
      u_background: [0, 0, 0, 1],
    },
  });

  const initialState = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    const shaders: Shader[] = [
      {
        id: "46700.951879366534",
        name: "dots",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; // input\nuniform float u_frequency;  // [1, 100, 20]\nuniform float u_radius;     // [0, 1, 0.5]\nuniform float u_rotation;   // [0, 6.28, 0]\nuniform float u_constantSize; // [0, 1, 0]\nuniform vec4 u_background;  // color [1, 1, 1, 1]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvec2 rot(vec2 v, float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, -s, s, c) * v;\n}\n\nvoid main() {\n    // rotate UV space around center\n    vec2 rotUv = rot(vUv - 0.5, u_rotation) + 0.5;\n\n    // find nearest grid cell center in rotated space\n    vec2 cellUv = rotUv * u_frequency;\n    vec2 cellId = round(cellUv);\n\n    // unrotate cell center to sample from original texture\n    vec2 sampleUv = rot(cellId / u_frequency - 0.5, -u_rotation) + 0.5;\n    vec4 cellColor = texture(u_texture, clamp(sampleUv, 0.0, 1.0));\n\n    // luminance drives dot radius unless constant size is toggled\n    float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));\n    float dotRadius = u_radius * mix(lum, 1.0, step(0.5, u_constantSize));\n\n    // distance from current pixel to nearest cell center (in cell-space units)\n    float dist = length(cellUv - cellId) / u_frequency * u_frequency;\n\n    fragColor = dist < dotRadius ? cellColor : u_background;\n}\n",
        resolution: { width: 200, height: 200 },
      },
      {
        id: "35514.33495797567",
        name: "image viewer",
        source:
          "#version 300 es\nprecision highp float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D u_image_source; // texture\nuniform vec2 resolution; // resolution\nuniform float scale; // [0.1, 3, 1]\n\nvoid main() {\n    ivec2 size = textureSize(u_image_source, 0);\n    vec2 aspect = vec2(\n        float(size.x) / float(size.y),\n        1.0\n    );\n\n    vec2 uv = vUv - 0.5;\n    uv /= aspect;\n    uv *= vec2(\n        resolution.x / resolution.y, 1.0\n    );\n    uv *= scale;\n    uv += 0.5; \n\n    uv.y = 1.0 - uv.y;\n\n    if (\n        any(lessThan(uv, vec2(0.0))) ||\n        any(greaterThan(uv, vec2(1.0)))\n    ) {\n        fragColor = vec4(vec3(0.0), 1.0);\n        return;\n    }\n\n    fragColor = texture(\n        u_image_source, \n        vec2(uv.x, uv.y)\n    );\n}",
        resolution: { width: 200, height: 200 },
      },
    ];

    const nodes: Node[] = shaders.map((shader, idx) => ({
      id: shader.id,
      position: {
        x: (shaders.length - idx) * -300,
        y: (shaders.length - idx) * 500,
      },
      zIndex: shaders.length - idx,
      data: {
        shader,
        uniforms: uniformsRef,
        paused: false,
      },
      type: "shader",
    }));

    const edges: Edge[] = [
      {
        id: "edge-2",
        source: "35514.33495797567",
        target: "46700.951879366534",
        targetHandle: "u_texture",
        type: "insert",
      },
    ];

    return { nodes, edges };
  }, []);

  const availableShaders: Shader[] = [
    {
      id: "template-dots",
      name: "dots",
      source: (initialState.nodes[0] as ShaderNode).data.shader.source,
      resolution: { width: 200, height: 200 },
    },
    {
      id: "template-viewer",
      name: "image viewer",
      source: (initialState.nodes[1] as ShaderNode).data.shader.source,
      resolution: { width: 200, height: 200 },
    },
  ];

  return (
    <Editor
      locked={true}
      shaders={availableShaders}
      initialState={{
        nodes: initialState.nodes,
        edges: initialState.edges,
        uniforms: uniformsRef.current,
      }}
      handleSave={() => {}}
      className="w-full h-full"
    />
  );
}
