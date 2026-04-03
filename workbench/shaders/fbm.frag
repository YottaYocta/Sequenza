#version 300 es
precision mediump float;

// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

uniform vec2 u_resolution; // resolution
uniform float u_time;      // time
uniform float u_scale;     // [1, 20, 3]
uniform float u_octaves;   // [1, 12, 6]
uniform float u_speed;     // [0, 2, 0.1]

in vec2 vUv;
out vec4 fragColor;

float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    int octaves = int(u_octaves);
    for (int i = 0; i < 12; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = vUv * u_scale;
    st.x *= u_resolution.x / u_resolution.y;

    // animate by scrolling noise space over time
    st += u_time * u_speed;

    fragColor = vec4(vec3(fbm(st)), 1.0);
}
