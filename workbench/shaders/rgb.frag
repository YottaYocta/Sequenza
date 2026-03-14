#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec3 u_rgbAdjust; // RGB offset in [−255, 255] — [0, 0, 0]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 color = texture(u_texture, vUv);
    vec3 adjusted = clamp(color.rgb + u_rgbAdjust / 255.0, 0.0, 1.0);
    fragColor = vec4(adjusted, color.a);
}
