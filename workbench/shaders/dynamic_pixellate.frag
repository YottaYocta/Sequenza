#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;

uniform sampler2D u_atlas;
uniform vec2 u_atlas_grid; // [1000, 10]

void main () {

    vec2 uv = vUv;

    vec2 u_atlas_size = 1.0 / u_atlas_grid;

    float num_of_atlases_fit_x = 1.0 / u_atlas_size.x;
    float atlas_mult_y = num_of_atlases_fit_x * u_atlas_grid.y / u_atlas_grid.x;

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