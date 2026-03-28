#version 300 es
precision highp float;

uniform float u_time; // time
uniform vec2 u_resolution; // resolution
uniform float u_speed; // [0, 100, 2]
uniform float u_period; // [0, 100, 2]
uniform float u_amplitude; // [0, 100, 2]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 uv = vec2(vUv.x * 2.0 - 1.0, (1.0 - vUv.y) * 2.0 - 1.0);
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float brightness = sin(uv.x * u_period + u_time * u_speed) * u_amplitude;
    fragColor = vec4(vec3(brightness + 1.0) * 0.5, 1.0);
}
