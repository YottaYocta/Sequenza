#version 300 es
precision mediump float;

uniform vec2 u_resolution;  // resolution
uniform vec2 u_center;      // [0.5, 0.5]
uniform vec2 u_size;        // [0.1, 0.1]
uniform float u_roundness;  // [0, 0.5, 0.0]
uniform float u_feather;    // [0, 0.1, 0.005]
uniform float u_invert;     // [0, 1, 0]

in vec2 vUv;
out vec4 fragColor;

float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vec2((vUv.x - u_center.x) * aspect, vUv.y - u_center.y);
    vec2 halfSize = vec2(u_size.x * aspect, u_size.y);

    float d = sdRoundRect(uv, halfSize, u_roundness);

    float v = 1.0 - smoothstep(-u_feather, u_feather, d);
    v = mix(v, 1.0 - v, step(0.5, u_invert));

    fragColor = vec4(vec3(v), 1.0);
}
