#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_amount;     // [0, 0.05, 0.01]
uniform float u_angle;      // [0, 6.28, 0]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 dir = vec2(cos(u_angle), sin(u_angle)) * u_amount;

    float r = texture(u_texture, vUv + dir).r;
    float g = texture(u_texture, vUv).g;
    float b = texture(u_texture, vUv - dir).b;
    float a = texture(u_texture, vUv).a;

    fragColor = vec4(r, g, b, a);
}
