import { RendererComponent, type Uniforms, type Patch } from "@sequenza/lib";
import {
  buildEditorState,
  type EditorInitialState,
} from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useRef, useEffect, useState } from "react";

interface RaceProps {
  enableHoverActivation?: boolean;
  handleEdit?: (initialState: EditorInitialState) => void;
}

function Race({ enableHoverActivation = true, handleEdit }: RaceProps) {
  const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());
  const cumulativeTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const isMouseOverRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    isMouseOverRef.current = isMouseOver;
  }, [isMouseOver]);

  useEffect(() => {
    lastFrameTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaMs = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      const shouldAccumulateTime = enableHoverActivation ? isMouseOverRef.current : true;
      if (shouldAccumulateTime) {
        cumulativeTimeRef.current += deltaMs / 1000;
      }

      uniformRef.current["44702.208364777616"].u_time = cumulativeTimeRef.current / 2;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const patch = getPatch();

  return (
    <div className="relative w-full h-full group">
      <div
        {...(enableHoverActivation && {
          onMouseEnter: () => setIsMouseOver(true),
          onMouseLeave: () => setIsMouseOver(false),
        })}
        className="w-full h-full"
      >
        <RendererComponent
          patch={patch}
          uniforms={uniformRef}
          animate={enableHoverActivation ? isMouseOver : true}
          width={1000}
          height={400}
          className="w-full h-full"
        ></RendererComponent>
      </div>
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

export default Race;

function getInitialUniforms(): Record<string, Uniforms> {
  return {
    "44702.208364777616": {
      u_time: 1933.827,
      u_resolution: [1000, 400],
      u_speed: 5,
      u_period: 2,
      u_amplitude: 0.86,
    },
    "65180.432493386106": {
      resolution: [1000, 400],
      rotation: [0.18, 1.06, 0.06],
      translation: [-0.1, -0.06, 1.99],
      scale: [0.01, 0.56],
      background_color: [0, 0, 0, 1],
    },
    "80526.3081279952": {
      u_blur_dist: 0.1,
      u_resolution: [1000, 400],
      u_angle: 0,
      u_blur_sample_count: 4,
      u_start_offset: 0.5,
    },
    "12813.031727200341": {},
    "66619.35653200101": {
      u_blur_dist: 0.1,
      u_resolution: [1000, 400],
      u_angle: 1.75,
      u_blur_sample_count: 8,
      u_start_offset: 0.5,
    },
    "80893.88954830846": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          {
            position: 0.19699525441845608,
            color: "#000000",
          },
          {
            position: 1,
            color: "#ffffff",
          },
        ],
      },
    },
    "25398.050555817386": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          {
            position: 0,
            color: "#000000",
          },
          {
            position: 0.7263206114026509,
            color: "#ffd600",
          },
          {
            position: 0.8659529090417112,
            color: "#fffdf1",
          },
          {
            position: 0.6076331584094498,
            color: "#ff2c00",
          },
          {
            position: 1,
            color: "#0418ff",
          },
        ],
      },
    },
    "32784.937457299": {
      u_hslAdjust: [0, 0, -0.78],
    },
    "44621.55201677116": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          {
            position: 0,
            color: "#000000",
          },
          {
            position: 1,
            color: "#ffffff",
          },
          {
            position: 0.7543347268208147,
            color: "#bdbebe",
          },
        ],
      },
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "25398.050555817386",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "shaders/gradientmap.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "44621.55201677116",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "shaders/gradientmap.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "12813.031727200341",
        source:
          "#version 300 es\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D u_texture_1;\nuniform sampler2D u_texture_2;\n\nvoid main() {\n    fragColor = clamp(\n        texture(u_texture_1, vUv) + texture(u_texture_2, vUv),\n        vec4(0.),\n        vec4(1.)\n    );\n\n}",
        name: "shaders/add.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "65180.432493386106",
        source:
          "#version 300 es\n#define PI 3.14159\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D input_tex;\nuniform vec2 resolution; // resolution\nuniform vec3 rotation; \nuniform vec3 translation; // [0, 0, 1]\nuniform vec2 scale; // [1, 1]\nuniform vec4 background_color; // color [1, 1, 1, 0]\n\nvec2 rotate(vec2 x, float angle_rad) {\n    float cos_val = cos(angle_rad);\n    float sin_val = sin(angle_rad);\n\n    return vec2(\n        cos_val * x.x - sin_val * x.y,\n        sin_val * x.x + cos_val * x.y\n    );\n}\n\nvec3 rotate3(vec3 v, vec3 rotation) {\n    v.yz = rotate(v.yz, rotation.x);\n    v.xz = rotate(v.xz, rotation.y);\n    v.xy = rotate(v.xy, rotation.z);\n    return v;\n}\n\nvec2 get_intersection_uv(vec3 ray_direction) {\n    // camera facing (0, 0, 1)\n    // initial image facing (0, 0, -1)\n    vec3 texture_normal = vec3(0.0, 0.0, -1.0);\n    vec3 texture_positive_x = vec3(1.0, 0.0, 0.0) * scale.x;\n    vec3 texture_positive_y = vec3(0.0, 1.0, 0.0) * scale.y;\n\n\n    texture_normal = rotate3(texture_normal, rotation);\n    texture_positive_x = rotate3(texture_positive_x, rotation);\n    texture_positive_y = rotate3(texture_positive_y, rotation);\n\n    float numerator = dot(translation, texture_normal);\n    float denominator = dot(ray_direction, texture_normal);\n    if (abs(denominator) < 1e-5) {\n        return vec2(-1.0);\n    }\n    float t = numerator / denominator;\n    vec3 intersection_point = t * ray_direction;\n    vec3 relative_dist = intersection_point - translation;\n\n    float proj_x = dot(relative_dist, texture_positive_x);\n    float proj_y = dot(relative_dist, texture_positive_y);\n\n    return vec2(proj_x, proj_y);\n}\n\n\n\nvoid main() {\n    vec2 aspect = vec2(\n        resolution.x / resolution.y,\n        1.0\n    );\n\n    vec2 uv = (vUv - 0.5) * aspect;\n\n    vec3 ray_direction = normalize(vec3(\n        uv,\n        1.0\n    ));\n\n    vec2 intersection_loc = get_intersection_uv(ray_direction);\n    uv = intersection_loc + 0.5;\n\n\n    if (any(greaterThan(uv, vec2(1.0))) || any(lessThan(uv, vec2(0.0)))) {\n        fragColor = clamp(background_color, vec4(0.0), vec4(1.0));\n        fragColor.rgb *= fragColor.a;\n        return;\n    } \n    \n    fragColor = texture(input_tex, uv);\n}",
        name: "transform 3D",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "32784.937457299",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; // input\nuniform vec3 u_hslAdjust; // H (degrees), S (0-1), L (0-1) — [0, 0, 0]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvec3 rgb2hsl(vec3 color) {\n    float maxC = max(max(color.r, color.g), color.b);\n    float minC = min(min(color.r, color.g), color.b);\n    float delta = maxC - minC;\n\n    float h = 0.0;\n    float s = 0.0;\n    float l = (maxC + minC) / 2.0;\n\n    if (delta != 0.0) {\n        s = l > 0.5 ? delta / (2.0 - maxC - minC) : delta / (maxC + minC);\n\n        if (color.r == maxC) {\n            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);\n        } else if (color.g == maxC) {\n            h = (color.b - color.r) / delta + 2.0;\n        } else {\n            h = (color.r - color.g) / delta + 4.0;\n        }\n        h /= 6.0;\n    }\n\n    return vec3(h, s, l);\n}\n\nfloat hue2rgb(float p, float q, float t) {\n    if (t < 0.0) t += 1.0;\n    if (t > 1.0) t -= 1.0;\n    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;\n    if (t < 1.0/2.0) return q;\n    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;\n    return p;\n}\n\nvec3 hsl2rgb(vec3 hsl) {\n    float h = hsl.x;\n    float s = hsl.y;\n    float l = hsl.z;\n\n    if (s == 0.0) {\n        return vec3(l);\n    }\n\n    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;\n    float p = 2.0 * l - q;\n    return vec3(\n        hue2rgb(p, q, h + 1.0/3.0),\n        hue2rgb(p, q, h),\n        hue2rgb(p, q, h - 1.0/3.0)\n    );\n}\n\nvoid main() {\n    vec4 color = texture(u_texture, vUv);\n\n    vec3 hsl = rgb2hsl(color.rgb);\n\n    hsl.x = mod(hsl.x + u_hslAdjust.x / 360.0, 1.0);\n    hsl.y = clamp(hsl.y + u_hslAdjust.y, 0.0, 1.0);\n    hsl.z = clamp(hsl.z + u_hslAdjust.z, 0.0, 1.0);\n\n    fragColor = vec4(hsl2rgb(hsl), color.a);\n}\n",
        name: "hue/saturation/value",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "44702.208364777616",
        source:
          "#version 300 es\nprecision highp float;\n\nuniform float u_time; // time\nuniform vec2 u_resolution; // resolution\nuniform float u_speed; // [0, 100, 2]\nuniform float u_period; // [0, 100, 2]\nuniform float u_amplitude; // [0, 100, 2]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n    vec2 uv = vec2(vUv.x * 2.0 - 1.0, (1.0 - vUv.y) * 2.0 - 1.0);\n    float aspect = u_resolution.x / u_resolution.y;\n    uv.x *= aspect;\n\n    float brightness = sin(uv.x * u_period + u_time * u_speed) * u_amplitude;\n    fragColor = vec4(vec3(brightness + 1.0) * 0.5, 1.0);\n}\n",
        name: "shaders/sin.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "66619.35653200101",
        source:
          "#version 300 es\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D u_input_tex;\nuniform float u_blur_dist; // [0, 1, 0.1]\nuniform vec2 u_resolution; // resolution\nuniform float u_angle; // [0, 10, 0]\nuniform float u_blur_sample_count; // [2, 50, 5]\nuniform float u_start_offset; // [0, 1, 0.5]\n\n\nmat2 rotate2D(float angle) {\n    float c = cos(angle);\n    float s = sin(angle);\n    return mat2(\n        c, -s, \n        s,  c  \n    );\n}\n\nvoid main() {\n    vec2 aspect = vec2(\n        u_resolution.x / u_resolution.y,\n        1.0\n    );\n\n    vec2 uv = vUv * aspect;\n\n    mat2 rot_mat = rotate2D(u_angle);\n    mat2 inv_rot_mat = rotate2D(-u_angle);\n    vec2 rotated_uv = rot_mat * uv;\n\n    int count = int(floor(u_blur_sample_count));\n\n    vec4 result = vec4(0.0);\n\n    float offset_bias = u_blur_dist * u_start_offset;\n\n    for (int i = 0; i < count; i++) {\n        float offset = float(i) / float(count) * u_blur_dist - offset_bias;\n        vec2 target_pos = rotated_uv + vec2(offset, 0.0);\n\n        result += texture(\n            u_input_tex,\n            (inv_rot_mat * target_pos) / aspect\n        );\n    }\n\n    fragColor = result / float(count);\n}",
        name: "shaders/directional_blur.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "80526.3081279952",
        source:
          "#version 300 es\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D u_input_tex;\nuniform float u_blur_dist; // [0, 1, 0.1]\nuniform vec2 u_resolution; // resolution\nuniform float u_angle; // [0, 10, 0]\nuniform float u_blur_sample_count; // [2, 50, 5]\nuniform float u_start_offset; // [0, 1, 0.5]\n\n\nmat2 rotate2D(float angle) {\n    float c = cos(angle);\n    float s = sin(angle);\n    return mat2(\n        c, -s, \n        s,  c  \n    );\n}\n\nvoid main() {\n    vec2 aspect = vec2(\n        u_resolution.x / u_resolution.y,\n        1.0\n    );\n\n    vec2 uv = vUv * aspect;\n\n    mat2 rot_mat = rotate2D(u_angle);\n    mat2 inv_rot_mat = rotate2D(-u_angle);\n    vec2 rotated_uv = rot_mat * uv;\n\n    int count = int(floor(u_blur_sample_count));\n\n    vec4 result = vec4(0.0);\n\n    float offset_bias = u_blur_dist * u_start_offset;\n\n    for (int i = 0; i < count; i++) {\n        float offset = float(i) / float(count) * u_blur_dist - offset_bias;\n        vec2 target_pos = rotated_uv + vec2(offset, 0.0);\n\n        result += texture(\n            u_input_tex,\n            (inv_rot_mat * target_pos) / aspect\n        );\n    }\n\n    fragColor = result / float(count);\n}",
        name: "shaders/directional_blur.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
      {
        id: "80893.88954830846",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        name: "shaders/gradientmap.frag",
        resolution: {
          width: 1000,
          height: 400,
        },
      },
    ],
    connections: [
      {
        from: "44621.55201677116",
        to: "25398.050555817386",
        input: "u_texture",
      },
      {
        from: "12813.031727200341",
        to: "44621.55201677116",
        input: "u_texture",
      },
      {
        from: "65180.432493386106",
        to: "12813.031727200341",
        input: "u_texture_1",
      },
      {
        from: "32784.937457299",
        to: "12813.031727200341",
        input: "u_texture_2",
      },
      {
        from: "44702.208364777616",
        to: "65180.432493386106",
        input: "input_tex",
      },
      {
        from: "66619.35653200101",
        to: "32784.937457299",
        input: "u_texture",
      },
      {
        from: "80526.3081279952",
        to: "66619.35653200101",
        input: "u_input_tex",
      },
      {
        from: "80893.88954830846",
        to: "80526.3081279952",
        input: "u_input_tex",
      },
      {
        from: "65180.432493386106",
        to: "80893.88954830846",
        input: "u_texture",
      },
      {
        from: "44702.208364777616",
        to: "65180.432493386106",
        input: "input_tex",
      },
    ],
  };
}
