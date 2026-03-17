#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_source; // texture

void main() {
    fragColor = texture(u_image_source, vec2(vUv.x, 1.0-vUv.y));
}