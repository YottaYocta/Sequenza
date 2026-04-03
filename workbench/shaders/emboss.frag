#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec2 u_resolution;  // resolution
uniform float u_angle;      // [0, 6.28, 0.785]
uniform float u_strength;   // [0, 5, 1]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 px = 1.0 / u_resolution;
    vec2 dir = vec2(cos(u_angle), sin(u_angle));

    vec3 a = texture(u_texture, vUv - px * dir).rgb;
    vec3 b = texture(u_texture, vUv + px * dir).rgb;

    // emboss: difference from opposite directions, lifted to mid-grey
    vec3 emboss = clamp((b - a) * u_strength + 0.5, 0.0, 1.0);

    fragColor = vec4(emboss, 1.0);
}
