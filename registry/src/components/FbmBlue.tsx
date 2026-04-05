import {
  RendererComponent,
  extractFields,
  type Uniforms,
  type Patch,
} from "@sequenza/lib";
import { buildEditorState, type EditorInitialState } from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef } from "react";

interface FbmBlueProps {
  handleEdit?: (initialState: EditorInitialState) => void;
}

function FbmBlue({ handleEdit }: FbmBlueProps) {
  const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());

  useEffect(() => {
    const patch = getPatch();

    const timeFields: Array<{ shaderId: string; fieldName: string }> = [];
    const mouseFields: Array<{ shaderId: string; fieldName: string }> = [];

    for (const shader of patch.shaders) {
      const fields = extractFields(shader);
      for (const field of fields) {
        if (field.type === "float" && field.special === "time") {
          timeFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (field.type === "vec2" && field.special === "mouse") {
          mouseFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (field.type === "vec2" && field.special === "resolution") {
          uniformRef.current[shader.id] ??= {};
          uniformRef.current[shader.id][field.name] = [
            shader.resolution.width,
            shader.resolution.height,
          ];
        }
      }
    }

    let onMouseMove: ((e: MouseEvent) => void) | undefined;
    if (mouseFields.length > 0) {
      onMouseMove = (e: MouseEvent) => {
        const x = Math.min(1, e.clientX / window.innerWidth);
        const y = Math.min(1, e.clientY / window.innerHeight);
        for (const { shaderId, fieldName } of mouseFields) {
          uniformRef.current[shaderId] ??= {};
          uniformRef.current[shaderId][fieldName] = [x, y];
        }
      };
      window.addEventListener("mousemove", onMouseMove);
    }

    let rafId: number | undefined;
    if (timeFields.length > 0) {
      const startTime = performance.now();
      const loop = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        for (const { shaderId, fieldName } of timeFields) {
          uniformRef.current[shaderId] ??= {};
          uniformRef.current[shaderId][fieldName] = elapsed;
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  const patch = getPatch();

  return (
    <div className="relative w-full h-full group rounded-md overflow-clip">
      <RendererComponent
        patch={patch}
        uniforms={uniformRef}
        animate={true}
        width={2000}
        height={500}
        className="w-full h-full"
      />
      {handleEdit && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 group-hover:opacity-100 opacity-0 transition group-hover:transition-none duration-200">
          <button
            className="button-base"
            onClick={() =>
              handleEdit(buildEditorState(patch, getInitialUniforms()))
            }
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

export default FbmBlue;

function getInitialUniforms(): Record<string, Uniforms> {
  return {
    "93196.26471738808": {
      u_resolution: [2000, 500],
      u_time: 107.722,
      u_scale: 3,
      u_octaves: 6,
      u_speed: 0.1,
    },
    "62914.470069720075": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0, color: "#0111fa" },
          { position: 0.9652226608858414, color: "#2e8bf6" },
          { position: 0.5853443898353902, color: "#51b8f9" },
          { position: 0.6988533487415897, color: "#ffffff" },
        ],
      },
    },
    "64965.02253831176": {
      resolution: [2000, 500],
      rotation: [-0.68, -0.52, 3.69],
      translation: [-1.08, 1.62, 2.36],
      scale: [0.21, 0.02],
      background_color: [1, 1, 1, 0],
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "64965.02253831176",
        source:
          "#version 300 es\n#define PI 3.14159\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D input_tex;\nuniform vec2 resolution; // resolution\nuniform vec3 rotation; \nuniform vec3 translation; // [0, 0, 1]\nuniform vec2 scale; // [1, 1]\nuniform vec4 background_color; // color [1, 1, 1, 0]\n\nvec2 rotate(vec2 x, float angle_rad) {\n    float cos_val = cos(angle_rad);\n    float sin_val = sin(angle_rad);\n\n    return vec2(\n        cos_val * x.x - sin_val * x.y,\n        sin_val * x.x + cos_val * x.y\n    );\n}\n\nvec3 rotate3(vec3 v, vec3 rotation) {\n    v.yz = rotate(v.yz, rotation.x);\n    v.xz = rotate(v.xz, rotation.y);\n    v.xy = rotate(v.xy, rotation.z);\n    return v;\n}\n\nvec2 get_intersection_uv(vec3 ray_direction) {\n    // camera facing (0, 0, 1)\n    // initial image facing (0, 0, -1)\n    vec3 texture_normal = vec3(0.0, 0.0, -1.0);\n    vec3 texture_positive_x = vec3(1.0, 0.0, 0.0) * scale.x;\n    vec3 texture_positive_y = vec3(0.0, 1.0, 0.0) * scale.y;\n\n\n    texture_normal = rotate3(texture_normal, rotation);\n    texture_positive_x = rotate3(texture_positive_x, rotation);\n    texture_positive_y = rotate3(texture_positive_y, rotation);\n\n    float numerator = dot(translation, texture_normal);\n    float denominator = dot(ray_direction, texture_normal);\n    if (abs(denominator) < 1e-5) {\n        return vec2(-1.0);\n    }\n    float t = numerator / denominator;\n    vec3 intersection_point = t * ray_direction;\n    vec3 relative_dist = intersection_point - translation;\n\n    float proj_x = dot(relative_dist, texture_positive_x);\n    float proj_y = dot(relative_dist, texture_positive_y);\n\n    return vec2(proj_x, proj_y);\n}\n\n\n\nvoid main() {\n    vec2 aspect = vec2(\n        resolution.x / resolution.y,\n        1.0\n    );\n\n    vec2 uv = (vUv - 0.5) * aspect;\n\n    vec3 ray_direction = normalize(vec3(\n        uv,\n        1.0\n    ));\n\n    vec2 intersection_loc = get_intersection_uv(ray_direction);\n    uv = intersection_loc + 0.5;\n\n\n    if (any(greaterThan(uv, vec2(1.0))) || any(lessThan(uv, vec2(0.0)))) {\n        fragColor = clamp(background_color, vec4(0.0), vec4(1.0));\n        fragColor.rgb *= fragColor.a;\n        return;\n    } \n    \n    fragColor = texture(input_tex, uv);\n}",
        name: "transform 3D",
        resolution: { width: 2000, height: 500 },
      },
      {
        id: "62914.470069720075",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "shaders/gradientmap.frag",
        resolution: { width: 2000, height: 500 },
      },
      {
        id: "93196.26471738808",
        source:
          "#version 300 es\nprecision mediump float;\n\n// Author @patriciogv - 2015\n// http://patriciogonzalezvivo.com\n\nuniform vec2 u_resolution; // resolution\nuniform float u_time;      // time\nuniform float u_scale;     // [1, 20, 3]\nuniform float u_octaves;   // [1, 12, 6]\nuniform float u_speed;     // [0, 2, 0.1]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nfloat random(vec2 st) {\n    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);\n}\n\n// Based on Morgan McGuire @morgan3d\n// https://www.shadertoy.com/view/4dS3Wd\nfloat noise(vec2 st) {\n    vec2 i = floor(st);\n    vec2 f = fract(st);\n\n    float a = random(i);\n    float b = random(i + vec2(1.0, 0.0));\n    float c = random(i + vec2(0.0, 1.0));\n    float d = random(i + vec2(1.0, 1.0));\n\n    vec2 u = f * f * (3.0 - 2.0 * f);\n\n    return mix(a, b, u.x) +\n           (c - a) * u.y * (1.0 - u.x) +\n           (d - b) * u.x * u.y;\n}\n\nfloat fbm(vec2 st) {\n    float value = 0.0;\n    float amplitude = 0.5;\n    int octaves = int(u_octaves);\n    for (int i = 0; i < 12; i++) {\n        if (i >= octaves) break;\n        value += amplitude * noise(st);\n        st *= 2.0;\n        amplitude *= 0.5;\n    }\n    return value;\n}\n\nvoid main() {\n    vec2 st = vUv * u_scale;\n    st.x *= u_resolution.x / u_resolution.y;\n\n    // animate by scrolling noise space over time\n    st += u_time * u_speed;\n\n    fragColor = vec4(vec3(fbm(st)), 1.0);\n}\n",
        name: "shaders/fbm.frag",
        resolution: { width: 2000, height: 500 },
      },
    ],
    connections: [
      {
        from: "62914.470069720075",
        to: "64965.02253831176",
        input: "input_tex",
      },
      {
        from: "93196.26471738808",
        to: "62914.470069720075",
        input: "u_texture",
      },
    ],
  };
}
