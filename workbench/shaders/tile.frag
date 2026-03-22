#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input_tex; 
uniform vec2 u_tile; // [2, 2]
uniform vec2 u_resolution; // resolution
uniform float u_tile_scale; // [0.01, 100, 2]

void main() {
    vec2 tile_uv = fract(vUv * vec2(u_tile.x, u_tile.y));
    vec2 tile_aspect = vec2(u_tile.x / u_tile.y, 1.0);

    vec2 centered = tile_uv - 0.5;
    centered /= u_tile_scale;
    vec2 texture_space = centered / tile_aspect + 0.5;

    if (
        any(lessThan(texture_space, vec2(0.0))) ||
        any(greaterThan(texture_space, vec2(1.0)))
    ) {
        fragColor = vec4(vec3(0.0), 1.0);
        return;
    }

    fragColor = texture(
        u_input_tex,
        texture_space
    );
}