#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_texture_1;
uniform sampler2D u_texture_2;

void main() {
    fragColor = texture(u_texture_1, vUv) + texture(u_texture_2, vUv);
}