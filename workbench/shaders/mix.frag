#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_texture_1;
uniform sampler2D u_texture_2;
uniform float u_factor; // [0, 1, 0.5]

void main() {
    fragColor = mix(
        texture(u_texture_1, vUv),
        texture(u_texture_2, vUv),
        u_factor
    );
}

