#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;

uniform float u_atlas_width; // [0.1, 100, 1]
uniform float u_divide_into; // [0.1, 100, 1]
uniform float u_scale; // [0.1, 1000, 1]

void main () {

    vec2 uv = vUv;

    vec2 u_atlas_size = vec2(1.0 / ((u_atlas_width/ u_divide_into) * u_scale * u_scale), 1.0 / (u_scale * u_scale));

    float num_of_atlases_fit_x = 1.0 / u_atlas_size.x;
    float atlas_mult_y = num_of_atlases_fit_x * u_atlas_size.y / u_atlas_size.x;

    vec2 target_uv = vec2(
        floor(uv.x * num_of_atlases_fit_x) / num_of_atlases_fit_x,
        floor(uv.y * atlas_mult_y)  / atlas_mult_y
    );

    vec4 target_color = texture(u_input, target_uv);

    fragColor = vec4(
        target_color.rgb, 
        1.0
    );
}