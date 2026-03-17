#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2 u_resolution; // resolution
uniform float u_dot_size;  // [0.01, 1000, 5]
uniform float u_bias; // [-100, 100, 0]
uniform float u_sensitivity; // [0, 100, 1]
uniform float u_smoothing; // [0, 20, 3]

float lum(vec3 a) {
    return dot(a, vec3(0.299, 0.587, 0.114));
}

float smin(float a, float b) {
    return a + b - pow((pow(a-b, 2.0), u_smoothing), 0.5);
}

void main () {
    vec2 destination = vec2(
        round(vUv.x / u_dot_size * u_resolution.x),
        round(vUv.y / u_dot_size * u_resolution.y)
    ) * u_dot_size / u_resolution;

    vec2 lower = vec2(
        floor(vUv.x / u_dot_size * u_resolution.x),
        floor(vUv.y / u_dot_size * u_resolution.y)
    ) * u_dot_size / u_resolution;

    vec2 upper = vec2(
        ceil(vUv.x / u_dot_size * u_resolution.x),
        ceil(vUv.y / u_dot_size * u_resolution.y)
    ) * u_dot_size / u_resolution;


    float cell_width = abs(lower.x - upper.x);

    vec4 dest_color = texture(u_input, destination);
    float dest_lum = lum(dest_color.rgb);
    float distance = length(destination - vUv);
    float normalized_distance = distance / cell_width * dest_lum;

    float offset = cell_width;

    vec2 destination_r = destination + offset;
    vec4 dest_color_r = texture(u_input, destination_r);
    float dest_lum_r = lum(dest_color_r.rgb);
    float normalized_distance_r = length(destination_r - vUv) / cell_width * dest_lum_r;

    vec2 destination_l = destination - offset;
    vec4 dest_color_l = texture(u_input, destination_l);
    float dest_lum_l = lum(dest_color_l.rgb);
    float normalized_distance_l = length(destination_l - vUv) / cell_width * dest_lum_l;


    vec2 destination_u = destination + vec2(-offset, offset);
    vec4 dest_color_u = texture(u_input, destination_u);
    float dest_lum_u = lum(dest_color_u.rgb);
    float normalized_distance_u = length(destination_u - vUv) / cell_width * dest_lum_u;


    vec2 destination_d = destination - vec2(-offset, offset);
    vec4 dest_color_d = texture(u_input, destination_d);
    float dest_lum_d = lum(dest_color_d.rgb);
    float normalized_distance_d = length(destination_d - vUv) / cell_width * dest_lum_d;


    fragColor = vec4(
        mix(
            vec3(0.),
            vec3(1.),
            round(
            smin(
                smin(
                    smin(
                        smin(normalized_distance, normalized_distance_r),
                        normalized_distance_l
                    ),
                    normalized_distance_u
                ) * u_sensitivity,
                normalized_distance_d
            ) + u_bias
            )
        ),
        1.0
    );
}