import { RendererComponent, type Uniforms, type Patch } from "@sequenza/lib";
import {
  ExportDialog,
  buildEditorState,
  type EditorInitialState,
} from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef, useState, type FC } from "react";

interface Dots1Props {
  source: string | HTMLVideoElement;
  handleEdit?: (initialState: EditorInitialState) => void;
}

const TARGET_WIDTH = 200;

const Dots1: FC<Dots1Props> = ({ source, handleEdit }) => {
  const uniformRef = useRef<Record<string, Uniforms>>(
    getInitialUniforms(source),
  );
  const [height, setHeight] = useState(175);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    uniformRef.current = getInitialUniforms(source);
    if (typeof source === "string") {
      const img = new Image();
      img.onload = () =>
        setHeight(
          Math.round((img.naturalHeight / img.naturalWidth) * TARGET_WIDTH),
        );
      img.src = source;
    } else {
      const apply = () =>
        setHeight(
          Math.round((source.videoHeight / source.videoWidth) * TARGET_WIDTH),
        );
      if (source.readyState >= 1) apply();
      else source.addEventListener("loadedmetadata", apply, { once: true });
    }
  }, [source]);

  const patch = getPatch();

  return (
    <div className="relative w-full h-full group">
      <RendererComponent
        patch={patch}
        uniforms={uniformRef}
        width={TARGET_WIDTH}
        height={height}
        className={"w-full h-full object-cover object-center"}
        animate
      />
      <div className="absolute top-1.5 right-1.5 flex gap-1 group-hover:opacity-100 opacity-0 transition group-hover:transition-none duration-200 ">
        <button className="button-base" onClick={() => setExportOpen(true)}>
          Export
        </button>
        <ExportDialog
          uniforms={uniformRef.current}
          patch={patch}
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
        <button
          className="button-base"
          onClick={() =>
            handleEdit?.(buildEditorState(patch, getInitialUniforms(source)))
          }
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default Dots1;

function getInitialUniforms(
  source: string | HTMLVideoElement,
): Record<string, Uniforms> {
  return {
    "69135.73029281368": {
      imageSource: { type: "texture", src: source },
    },
    "35956.86526224712": {
      u_frequency: 34.07,
      u_radius: 0.76,
      u_rotation: 0.16,
      u_constantSize: 0,
      u_background: [0, 0, 0, 1],
    },
    "74691.59624507601": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0.05409101818809446, color: "#723023" },
          { position: 0.8565373418281972, color: "#f5ff01" },
          { position: 0.48635164829145694, color: "#ff2a00" },
        ],
      },
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "35956.86526224712",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; // input\nuniform float u_frequency;  // [1, 100, 20]\nuniform float u_radius;     // [0, 1, 0.5]\nuniform float u_rotation;   // [0, 6.28, 0]\nuniform float u_constantSize; // [0, 1, 0]\nuniform vec4 u_background;  // color [1, 1, 1, 1]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvec2 rot(vec2 v, float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, -s, s, c) * v;\n}\n\nvoid main() {\n    // rotate UV space around center\n    vec2 rotUv = rot(vUv - 0.5, u_rotation) + 0.5;\n\n    // find nearest grid cell center in rotated space\n    vec2 cellUv = rotUv * u_frequency;\n    vec2 cellId = round(cellUv);\n\n    // unrotate cell center to sample from original texture\n    vec2 sampleUv = rot(cellId / u_frequency - 0.5, -u_rotation) + 0.5;\n    vec4 cellColor = texture(u_texture, clamp(sampleUv, 0.0, 1.0));\n\n    // luminance drives dot radius unless constant size is toggled\n    float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));\n    float dotRadius = u_radius * mix(lum, 1.0, step(0.5, u_constantSize));\n\n    // distance from current pixel to nearest cell center (in cell-space units)\n    float dist = length(cellUv - cellId) / u_frequency * u_frequency;\n\n    fragColor = dist < dotRadius ? cellColor : u_background;\n}\n",
        name: "dots.frag",
        resolution: { width: 300, height: 300 },
      },
      {
        id: "74691.59624507601",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "gradientmap.frag",
        resolution: { width: 100, height: 100 },
      },
      {
        id: "69135.73029281368",
        source:
          "#version 300 es\nprecision highp float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D imageSource; // texture\n\nvoid main() {\n    fragColor = texture(imageSource, vec2(vUv.x, 1.0-vUv.y));\n}",
        name: "shaders/imageViewer.frag",
        resolution: { width: 100, height: 100 },
      },
    ],
    connections: [
      {
        from: "74691.59624507601",
        to: "35956.86526224712",
        input: "u_texture",
      },
      {
        from: "69135.73029281368",
        to: "74691.59624507601",
        input: "u_texture",
      },
    ],
  };
}
