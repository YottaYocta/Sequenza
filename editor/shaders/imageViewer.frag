#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D imageSource; // texture

void main() {
    fragColor = texture(imageSource, vUv);
}