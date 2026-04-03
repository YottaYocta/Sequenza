#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec2 u_resolution;  // resolution
uniform float u_frequency;  // [1, 1000, 20]
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
    float aspect = u_resolution.x / u_resolution.y;

    // rotate UV space around center (aspect-corrected)
    vec2 aUv = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
    vec2 rotUv = rot(aUv, u_rotation);

    // find nearest grid cell center in rotated space
    vec2 cellUv = rotUv * u_frequency;
    vec2 cellId = round(cellUv);

    // unrotate cell center back to texture UV space
    vec2 sampleUv = rot(cellId / u_frequency, -u_rotation) / vec2(aspect, 1.0) + 0.5;
    vec4 cellColor = texture(u_texture, clamp(sampleUv, 0.0, 1.0));

    // luminance drives dot radius unless constant size is toggled
    float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
    float dotRadius = u_radius * mix(lum, 1.0, step(0.5, u_constantSize));

    // distance from current pixel to nearest cell center (in cell-space units)
    float dist = length(cellUv - cellId);

    fragColor = dist < dotRadius ? cellColor : u_background;
}
