#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_texture_1;
uniform sampler2D u_texture_2;
uniform sampler2D u_mask;

void main() {
    vec4 color1 = texture(u_texture_1, vUv);
    vec4 color2 = texture(u_texture_2, vUv);
    vec4 maskColor = texture(u_mask, vUv);

    float brightness = (maskColor.r + maskColor.g + maskColor.b) / 3.0;

    fragColor = mix(color1, color2, brightness);
}
