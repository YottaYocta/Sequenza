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
    vec2 cell = vUv * u_resolution / u_dot_size;

    vec2 destination = round(cell) * u_dot_size / u_resolution;
    vec2 lower        = floor(cell) * u_dot_size / u_resolution;
    vec2 upper        = ceil(cell)  * u_dot_size / u_resolution;
    float cell_width  = abs(lower.x - upper.x);
    float offset      = cell_width;

    vec2 destination_r = destination + vec2(offset, 0.0);
    vec2 destination_l = destination + vec2(-offset, 0.0);
    vec2 destination_u = destination + vec2(0.0, offset);
    vec2 destination_d = destination + vec2(0.0, -offset);

    float nd   = length(destination   - vUv) / cell_width * lum(texture(u_input, destination).rgb);
    float nd_r = length(destination_r - vUv) / cell_width * lum(texture(u_input, destination_r).rgb);
    float nd_l = length(destination_l - vUv) / cell_width * lum(texture(u_input, destination_l).rgb);
    float nd_u = length(destination_u - vUv) / cell_width * lum(texture(u_input, destination_u).rgb);
    float nd_d = length(destination_d - vUv) / cell_width * lum(texture(u_input, destination_d).rgb);

    float k = u_smoothing;
    float d = smin(smin(smin(smin(nd, nd_r, k), nd_l, k), nd_u, k), nd_d, k);

    float val = smoothstep(0.52, 0.50, 1.0 - d * u_sensitivity + u_bias);
    fragColor = vec4(vec3(val), 1.0);
}