import {
  RendererComponent,
  extractFields,
  type Uniforms,
  type Patch,
} from "@sequenza/lib";
import "@sequenza/lib/style.css";
import { useEffect, useRef } from "react";

interface SinDotsProps {
  className?: string;
}

function SinDots({ className }: SinDotsProps) {
  const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());

  useEffect(() => {
    const patch = getPatch();
    const timeFields: Array<{ shaderId: string; fieldName: string }> = [];

    for (const shader of patch.shaders) {
      const fields = extractFields(shader);
      for (const field of fields) {
        if (field.type === "float" && field.special === "time") {
          timeFields.push({ shaderId: shader.id, fieldName: field.name });
        }
      }
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
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <RendererComponent
      patch={getPatch()}
      uniforms={uniformRef}
      animate={true}
      width={1280}
      height={400}
      className={className}
    />
  );
}

export default SinDots;

function getInitialUniforms(): Record<string, Uniforms> {
  return {
    "86989.31976518266": {
      u_resolution: [1280, 400],
      u_speed: 1,
      u_period: 2,
      u_amplitude: 0.5,
      u_time: 1460.81,
    },
    "44477.16280056494": {
      resolution: [1280, 400],
      rotation: [0.28, 0.25, 0.36],
      translation: [0, 0, 1],
      scale: [0.4, 0.52],
      background_color: [1, 1, 1, 0],
    },
    "27670.01073439467": {
      u_resolution: [1280, 400],
      u_frequency: 15,
      u_radius: 0.84,
      u_rotation: 0,
      u_constantSize: 0,
      u_background: [1, 1, 1, 1],
    },
    "26334.025224155477": {
      u_gradientTexture: {
        type: "gradient",
        stops: [
          { position: 0.8029258465785355, color: "#005fff" },
          { position: 1, color: "#ffffff" },
        ],
      },
    },
  };
}

function getPatch(): Patch {
  return {
    shaders: [
      {
        id: "26334.025224155477",
        name: "gradient map",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; \nuniform sampler2D u_gradientTexture; // gradient\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n  vec4 color = texture(u_texture, vUv);\n\n  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));\n\n  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));\n\n  fragColor = vec4(gradientColor.rgb, 1.0);\n}\n",
        resolution: { width: 1280, height: 400 },
      },
      {
        id: "27670.01073439467",
        name: "dots",
        source:
          "#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture; // input\nuniform vec2 u_resolution;  // resolution\nuniform float u_frequency;  // [1, 1000, 20]\nuniform float u_radius;     // [0, 1, 0.5]\nuniform float u_rotation;   // [0, 6.28, 0]\nuniform float u_constantSize; // [0, 1, 0]\nuniform vec4 u_background;  // color [1, 1, 1, 1]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvec2 rot(vec2 v, float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, -s, s, c) * v;\n}\n\nvoid main() {\n    float aspect = u_resolution.x / u_resolution.y;\n\n    vec2 aUv = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);\n    vec2 rotUv = rot(aUv, u_rotation);\n\n    vec2 cellUv = rotUv * u_frequency;\n    vec2 cellId = round(cellUv);\n\n    vec2 sampleUv = rot(cellId / u_frequency, -u_rotation) / vec2(aspect, 1.0) + 0.5;\n    vec4 cellColor = texture(u_texture, clamp(sampleUv, 0.0, 1.0));\n\n    float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));\n    float dotRadius = u_radius * mix(lum, 1.0, step(0.5, u_constantSize));\n\n    float dist = length(cellUv - cellId);\n\n    fragColor = dist < dotRadius ? cellColor : u_background;\n}\n",
        resolution: { width: 1280, height: 400 },
      },
      {
        id: "44477.16280056494",
        name: "transform 3D",
        source:
          "#version 300 es\n#define PI 3.14159\nprecision mediump float;\n\nin vec2 vUv;\nout vec4 fragColor;\n\nuniform sampler2D input_tex;\nuniform vec2 resolution; // resolution\nuniform vec3 rotation;  // [0, 0, 0]\nuniform vec3 translation; // [0, 0, 1]\nuniform vec2 scale; // [1, 1]\nuniform vec4 background_color; // color [1, 1, 1, 0]\n\nvec2 rotate(vec2 x, float angle_rad) {\n    float cos_val = cos(angle_rad);\n    float sin_val = sin(angle_rad);\n    return vec2(\n        cos_val * x.x - sin_val * x.y,\n        sin_val * x.x + cos_val * x.y\n    );\n}\n\nvec3 rotate3(vec3 v, vec3 rotation) {\n    v.yz = rotate(v.yz, rotation.x);\n    v.xz = rotate(v.xz, rotation.y);\n    v.xy = rotate(v.xy, rotation.z);\n    return v;\n}\n\nvec2 get_intersection_uv(vec3 ray_direction) {\n    vec3 texture_normal = vec3(0.0, 0.0, -1.0);\n    vec3 texture_positive_x = vec3(1.0, 0.0, 0.0) * scale.x;\n    vec3 texture_positive_y = vec3(0.0, 1.0, 0.0) * scale.y;\n\n    texture_normal = rotate3(texture_normal, rotation);\n    texture_positive_x = rotate3(texture_positive_x, rotation);\n    texture_positive_y = rotate3(texture_positive_y, rotation);\n\n    float numerator = dot(translation, texture_normal);\n    float denominator = dot(ray_direction, texture_normal);\n    if (abs(denominator) < 1e-5) {\n        return vec2(-1.0);\n    }\n    float t = numerator / denominator;\n    vec3 intersection_point = t * ray_direction;\n    vec3 relative_dist = intersection_point - translation;\n\n    float proj_x = dot(relative_dist, texture_positive_x);\n    float proj_y = dot(relative_dist, texture_positive_y);\n\n    return vec2(proj_x, proj_y);\n}\n\nvoid main() {\n    vec2 aspect = vec2(\n        resolution.x / resolution.y,\n        1.0\n    );\n\n    vec2 uv = (vUv - 0.5) * aspect;\n\n    vec3 ray_direction = normalize(vec3(\n        uv,\n        1.0\n    ));\n\n    vec2 intersection_loc = get_intersection_uv(ray_direction);\n    uv = intersection_loc + 0.5;\n\n    if (any(greaterThan(uv, vec2(1.0))) || any(lessThan(uv, vec2(0.0)))) {\n        fragColor = clamp(background_color, vec4(0.0), vec4(1.0));\n        fragColor.rgb *= fragColor.a;\n        return;\n    } \n    \n    fragColor = texture(input_tex, uv);\n}",
        resolution: { width: 1280, height: 400 },
      },
      {
        id: "86989.31976518266",
        name: "sin",
        source:
          "#version 300 es\nprecision highp float;\n\nuniform float u_time; // time\nuniform vec2 u_resolution; // resolution\nuniform float u_speed; // [0, 100, 2]\nuniform float u_period; // [0, 100, 2]\nuniform float u_amplitude; // [0, 100, 2]\n\nin vec2 vUv;\nout vec4 fragColor;\n\nvoid main() {\n    vec2 uv = vec2(vUv.x * 2.0 - 1.0, (1.0 - vUv.y) * 2.0 - 1.0);\n    float aspect = u_resolution.x / u_resolution.y;\n    uv.x *= aspect;\n\n    float brightness = sin(uv.x * u_period + u_time * u_speed) * u_amplitude;\n    fragColor = vec4(vec3(brightness + 1.0) * 0.5, 1.0);\n}\n",
        resolution: { width: 1280, height: 400 },
      },
    ],
    connections: [
      {
        from: "27670.01073439467",
        to: "26334.025224155477",
        input: "u_texture",
      },
      {
        from: "44477.16280056494",
        to: "27670.01073439467",
        input: "u_texture",
      },
      {
        from: "86989.31976518266",
        to: "44477.16280056494",
        input: "input_tex",
      },
    ],
  };
}
