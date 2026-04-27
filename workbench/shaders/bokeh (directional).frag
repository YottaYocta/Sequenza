#version 300 es
precision mediump float;

uniform vec2 u_resolution; // resolution

uniform sampler2D u_channel0;

uniform float u_radius;       // [0.0, 1, 0.01]
uniform float u_threshold;    // [0.001, 2, 0.5]
uniform float u_sample_count; // [1, 256, 64]

uniform vec2 u_origin; // [0.5, 0.5]   
uniform vec2 u_direction; // [0.1, -0.1]

in vec2 vUv;
out vec4 fragColor;

void main() {

    float computed_threshold_value = u_threshold * 100.0;
    float aspect = u_resolution.x / u_resolution.y;

    float proj = dot(vUv - u_origin, u_direction);
    float effective_radius = u_radius * max(proj, 0.0);

    mat2 rot = mat2(-0.737, -0.676, 0.676, -0.737);
    vec2 p_iso = vec2(effective_radius / sqrt(u_sample_count), 0.0);

    float N = 0.0;

    vec4 O = vec4(0.0);
    for (float i = 1.0; i < u_sample_count; i += 1.0) {
        p_iso = rot * p_iso;

        vec2 p_uv = vec2(p_iso.x / aspect, p_iso.y);
        O += exp(texture(u_channel0, vUv + p_uv * sqrt(i)) * computed_threshold_value);
        N += 1.0;
    }

    O = (log(O) - log(N));
    O /= computed_threshold_value;
    fragColor = O;
}
