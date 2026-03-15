import { RendererComponent, type Uniforms, type Patch } from "@sequenza/lib";
import {
  ExportDialog,
  buildEditorState,
  type EditorInitialState,
} from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef, useState, type FC } from "react";

interface HeatMapProps {
  source: string | HTMLVideoElement;
  handleEdit?: (initialState: EditorInitialState) => void;
}

const TARGET_WIDTH = 200;

const HeatMap: FC<HeatMapProps> = ({ source, handleEdit }) => {
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
    <div className="relative w-full h-full group ">
      <RendererComponent
        patch={patch}
        uniforms={uniformRef}
        width={TARGET_WIDTH}
        height={height}
        className={"w-full h-full object-cover object-center"}
        animate
      />
      <div className="absolute top-1.5 right-1.5 flex gap-1 group-hover:opacity-100 opacity-0 transition group-hover:transition-none duration-200">
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

export default HeatMap;

function getInitialUniforms(
  source: string | HTMLVideoElement,
): Record<string, Uniforms> {
  return {
    "69135.73029281368": {
      imageSource: { type: "texture", src: source },
    },
    "74691.59624507601": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0.42340049524541423, color: "#00beff" },
          { position: 0.532206525054574, color: "#86ff88" },
          { position: 0.11807320398714469, color: "#000fff" },
          { position: 0.610546866517169, color: "#fff63b" },
          { position: 0.8020454789812903, color: "#ff6500" },
          { position: 0.8988281488418579, color: "#fafff4" },
        ],
      },
    },
    "69251.62009752115": {
      u_resolution: 100,
      u_numColors: 4,
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "69251.62009752115",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; // input\nuniform float u_resolution; // [1, 100, 20]\nuniform float u_numColors;  // [2, 16, 2]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nint bayer(int x, int y) {\n    int bayer64[64] = int[64](\n         0, 32,  8, 40,  2, 34, 10, 42,\n        48, 16, 56, 24, 50, 18, 58, 26,\n        12, 44,  4, 36, 14, 46,  6, 38,\n        60, 28, 52, 20, 62, 30, 54, 22,\n         3, 35, 11, 43,  1, 33,  9, 41,\n        51, 19, 59, 27, 49, 17, 57, 25,\n        15, 47,  7, 39, 13, 45,  5, 37,\n        63, 31, 55, 23, 61, 29, 53, 21\n    );\n    return bayer64[(y % 8) * 8 + (x % 8)];\n}\n\nvoid main() {\n    vec2 cell = floor(vUv * u_resolution);\n    vec2 cellUv = cell / u_resolution;\n\n    vec4 color = texture(u_texture, cellUv);\n\n    float threshold = (float(bayer(int(cell.x), int(cell.y))) + 0.5) / 64.0 - 0.5;\n\n    float n = max(2.0, u_numColors);\n    float step = 1.0 / (n - 1.0);\n    vec3 dithered = clamp(round((color.rgb + threshold * step) / step) * step, 0.0, 1.0);\n\n    fragColor = vec4(dithered, color.a);\n}\n",
        name: "dither_bayer.frag",
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
        to: "69251.62009752115",
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
