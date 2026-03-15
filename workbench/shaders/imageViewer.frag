#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D imageSource; // texture

void main() {
    fragColor = texture(imageSource, vec2(vUv.x, 1.0-vUv.y));
}