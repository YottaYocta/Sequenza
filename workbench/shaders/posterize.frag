#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_steps;      // [2, 32, 4]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, vUv);
    vec3 rgb = floor(c.rgb * u_steps + 0.5) / u_steps;
    fragColor = vec4(rgb, c.a);
}
