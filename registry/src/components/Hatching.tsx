import { RendererComponent, type Uniforms, type Patch } from "@sequenza/lib";
import {
  ExportDialog,
  buildEditorState,
  type EditorInitialState,
} from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef, useState, type FC } from "react";

interface HatchingProps {
  source: string | HTMLVideoElement;
  handleEdit?: (initialState: EditorInitialState) => void;
}

const TARGET_WIDTH = 200;

const Hatching: FC<HatchingProps> = ({ source, handleEdit }) => {
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

export default Hatching;

function getInitialUniforms(
  source: string | HTMLVideoElement,
): Record<string, Uniforms> {
  return {
    "69135.73029281368": {
      imageSource: { type: "texture", src: source },
    },
    "33722.566975975875": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0.3287803656826906, color: "#000000" },
          { position: 1, color: "#ffffff" },
        ],
      },
    },
    "34813.497803655126": {
      uTime: 0,
      uResolution: [100, 100],
      uMouse: [0, 0],
      uAmplitude: -0.12,
      uRotation: 0.92,
      uDensity: 81.36,
      uThreshold: -0.66,
      uLineColor: [0.01568627450980392, 0.19607843137254902, 1, 0],
      mode: 0.4,
    },
    "24436.56715224556": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0.08915995081307958, color: "#0432ff" },
          { position: 1, color: "#fefaef" },
        ],
      },
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "24436.56715224556",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "gradientmap.frag",
        resolution: { width: 200, height: 200 },
      },
      {
        id: "34813.497803655126",
        source:
          "#version 300 es\nprecision highp float;\n\nuniform float uTime; // time\nuniform vec2 uResolution; // [100, 100]\nuniform vec2 uMouse;\nuniform float uAmplitude;\n\nuniform float uRotation; // [0, 6.28, 0]\nuniform float uDensity;  // [10, 200, 30]    \nuniform float uThreshold;\nuniform vec4 uLineColor; // color [0,0,0,0]\n\nuniform sampler2D tInputTex; \nuniform float mode; // [0, 1, 1]\n\n\nin vec2 vUv;\nout vec4 fragColor;\n\nconst float PI = 3.1415926535897932384626433832795;\n\n/*\nangle is in radians\n*/\nvec2 rotate(vec2 uv, float angle) {\n    float c = cos(angle);\n    float s = sin(angle);\n    return mat2(c, -s, s, c) * uv;\n}\n\nvec2 invRotate(vec2 uv, float angle) {\n    float c = cos(angle);\n    float s = sin(angle);\n    return mat2(c, s, -s, c) * uv;\n}\n\nvec2 rotateCenter(vec2 uv, float angle) {\n    return rotate(uv - vec2(.5), uRotation) + vec2(.5);\n}\n\nvoid main() {\n    vec2 uv = vec2(vUv.x, vUv.y);\n    vec2 uvInRotatedSpace = invRotate(uv, uRotation);\n    vec2 targetPixInRot = vec2(floor(uvInRotatedSpace.x * uDensity + 0.5)/uDensity, uvInRotatedSpace.y);\n    vec2 targetPixInRot2 = vec2(floor((uvInRotatedSpace.x) * uDensity + 0.5)/uDensity, uvInRotatedSpace.y  + sin(uMouse) / 20.0);\n\n    float distanceFromTargetInRot = smoothstep(0.0, 1.0, abs(targetPixInRot.x - uvInRotatedSpace.x) * 1.2) * 15.0 / (1.0 + uAmplitude * 5.0);\n    float maxDist = 1.0 / uDensity;\n\n    vec2 targetInCart = invRotate(targetPixInRot, -uRotation);\n    vec2 targetInCart2 = invRotate(targetPixInRot2, -uRotation);\n    vec4 targetColor = (texture(tInputTex, targetInCart) + texture(tInputTex, targetInCart2)) * 0.5;\n\n    float targetLum = pow(dot(targetColor.rgb, vec3(0.299, 0.587, 0.114)), 2.0);\n\n    // 1.0 is solid; should be shaded. 0.0 should be white space\n    float solidMask = clamp(targetLum, 0.0, 1.0) < distanceFromTargetInRot * uDensity ? 1.0 : 0.0; \n\n\n    if (mode > 0.5) {\n        if (solidMask < 0.5) {\n            fragColor = vec4(vec3(uLineColor), 1.0);\n        } else {\n            fragColor = vec4(1.0);\n        }\n    } else {\n        if (solidMask > 0.5) {\n            fragColor = vec4(vec3(uLineColor), 1.0);\n        } else {\n            fragColor = vec4(1.0);\n        }\n    }\n\n}",
        name: "lines.frag",
        resolution: { width: 200, height: 200 },
      },
      {
        id: "33722.566975975875",
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
        from: "34813.497803655126",
        to: "24436.56715224556",
        input: "u_texture",
      },
      {
        from: "33722.566975975875",
        to: "34813.497803655126",
        input: "tInputTex",
      },
      {
        from: "69135.73029281368",
        to: "33722.566975975875",
        input: "u_texture",
      },
    ],
  };
}
