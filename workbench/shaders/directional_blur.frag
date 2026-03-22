#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input_tex;
uniform float u_blur_dist; // [0, 1, 0.1]
uniform vec2 u_resolution; // resolution
uniform float u_angle; // [0, 10, 0]
uniform float u_blur_sample_count; // [2, 50, 5]
uniform float u_start_offset; // [0, 1, 0.5]


mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(
        c, -s, 
        s,  c  
    );
}

void main() {
    vec2 aspect = vec2(
        u_resolution.x / u_resolution.y,
        1.0
    );

    vec2 uv = vUv * aspect;

    mat2 rot_mat = rotate2D(u_angle);
    mat2 inv_rot_mat = rotate2D(-u_angle);
    vec2 rotated_uv = rot_mat * uv;

    int count = int(floor(u_blur_sample_count));

    vec4 result = vec4(0.0);

    float offset_bias = u_blur_dist * u_start_offset;

    for (int i = 0; i < count; i++) {
        float offset = float(i) / float(count) * u_blur_dist - offset_bias;
        vec2 target_pos = rotated_uv + vec2(offset, 0.0);

        result += texture(
            u_input_tex,
            (inv_rot_mat * target_pos) / aspect
        );
    }

    fragColor = result / float(count);
}