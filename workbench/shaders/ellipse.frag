#version 300 es
precision mediump float;

uniform vec2 u_resolution;  // resolution
uniform vec2 u_center;      // [0.5, 0.5]
uniform float u_rx;         // [0, 1, 0.4]
uniform float u_ry;         // [0, 1, 0.25]
uniform float u_feather;    // [0, 0.1, 0.01]
uniform float u_invert;     // [0, 1, 0]

in vec2 vUv;
out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vec2((vUv.x - u_center.x) * aspect, vUv.y - u_center.y);

    // SDF for ellipse
    float d = length(uv / vec2(u_rx * aspect, u_ry)) - 1.0;

    float v = 1.0 - smoothstep(-u_feather, u_feather, d);
    v = mix(v, 1.0 - v, step(0.5, u_invert));

    fragColor = vec4(vec3(v), 1.0);
}
