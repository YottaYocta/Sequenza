#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_frequency;  // [1, 100, 20]
uniform float u_radius;     // [0, 1, 0.5]
uniform float u_rotation;   // [0, 6.28, 0]
uniform float u_constantSize; // [0, 1, 0]
uniform vec4 u_background;  // color [1, 1, 1, 1]

in vec2 vUv;
out vec4 fragColor;

vec2 rot(vec2 v, float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c) * v;
}

void main() {
    // rotate UV space around center
    vec2 rotUv = rot(vUv - 0.5, u_rotation) + 0.5;

    // find nearest grid cell center in rotated space
    vec2 cellUv = rotUv * u_frequency;
    vec2 cellId = round(cellUv);

    // unrotate cell center to sample from original texture
    vec2 sampleUv = rot(cellId / u_frequency - 0.5, -u_rotation) + 0.5;
    vec4 cellColor = texture(u_texture, clamp(sampleUv, 0.0, 1.0));

    // luminance drives dot radius unless constant size is toggled
    float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
    float dotRadius = u_radius * mix(lum, 1.0, step(0.5, u_constantSize));

    // distance from current pixel to nearest cell center (in cell-space units)
    float dist = length(cellUv - cellId) / u_frequency * u_frequency;

    fragColor = dist < dotRadius ? cellColor : u_background;
}
