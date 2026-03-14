#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec3 u_sourceColor; // color
uniform vec4 u_targetColor; // color [0, 0, 0, 0]
uniform float u_threshold; // [0, 1, 0.1]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, vUv);

    float colorDiff = distance(texColor.rgb, u_sourceColor) / 2.0;

    if (colorDiff < u_threshold) {
        fragColor = u_targetColor;
    } else {
        fragColor = texColor;
    }
}
