#version 300 es
precision mediump float;

uniform vec2 u_resolution;  // resolution
uniform vec2 u_mouse;       // mouse
uniform float u_size;       // [0, 0.5, 0.15]
uniform float u_brightness; // [0, 1, 1]

in vec2 vUv;
out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv    = vec2(vUv.x * aspect, 1.0-vUv.y);
    vec2 mouse = vec2(u_mouse.x * aspect, u_mouse.y);

    float dist = length(uv - mouse);
    float orb  = clamp(1.0 - dist / u_size, 0.0, 1.0);

    fragColor = vec4(vec3(orb * u_brightness), 1.0);
}
