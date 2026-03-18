#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2 u_resolution; // resolution
uniform float u_dot_size; // [0, 100, 3]
uniform float u_bias; // [-100, 100, 0]
uniform float u_sensitivity; // [0, 100, 1]
uniform float u_smoothing; // [0, 100, 1]

float lum(vec3 a) {
    return dot(a, vec3(0.299, 0.587, 0.114));
}

float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h*h*h*k*(1.0/6.0);
}

void main() {
    vec2 uv = fract(vUv * u_dot_size);

    float distance = length(
        uv - vec2(0.5)
    );
     
    fragColor = vec4(vec3(
        step(0.5, distance)
    ), 1.0);
}