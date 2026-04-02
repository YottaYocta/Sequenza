#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform sampler2D u_tile_atlas;

uniform vec2 u_resolution; // resolution
uniform float u_divide_into; // [0.1, 100, 1]
uniform vec2 u_tile_size; // [0.1, 0.1]
uniform float u_scale; // [0.1, 1000, 1]

void main () {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = vUv;
    uv -= 0.5;
    uv *= aspect;
    uv += 0.5;

    vec2 scaled_tile_size = u_tile_size * u_scale;

    float num_of_atlases_fit_x = 1.0 / scaled_tile_size.x;
    float atlas_mult_y = num_of_atlases_fit_x * scaled_tile_size.y / scaled_tile_size.x;

    vec2 target_uv = vec2(
        floor(uv.x * num_of_atlases_fit_x) / num_of_atlases_fit_x,
        floor(uv.y * atlas_mult_y)  / atlas_mult_y
    );

    vec2 next_target_uv = vec2(
        ceil(uv.x * num_of_atlases_fit_x) / num_of_atlases_fit_x,
        ceil(uv.y * atlas_mult_y)  / atlas_mult_y
    );

    vec4 target_color = texture(u_input, (target_uv - 0.5)/ aspect + 0.5);

    float lum = (target_color.r + target_color.g + target_color.b) / 3.0;

    float start_x = floor(lum * u_divide_into) / u_divide_into;
    float end_x = ceil(lum * u_divide_into) / u_divide_into;

    vec2 tile_space_uv = (uv - target_uv) / (next_target_uv - target_uv);

    vec2 atlas_space_uv = tile_space_uv * vec2(end_x - start_x, 1.0) + vec2(start_x, 0.0);

    vec4 tile_color = texture(u_tile_atlas, atlas_space_uv);

    fragColor = vec4(
        tile_color.rgb,
        1.0
    );
}