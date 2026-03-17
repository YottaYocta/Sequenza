#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2 u_resolution; // resolution
uniform float u_pixel_size;  // [0.01, 1000, 5]

void main () {
    vec2 destination = vec2(
        floor(vUv.x / u_pixel_size * u_resolution.x),
        floor(vUv.y / u_pixel_size * u_resolution.y)
    ) * u_pixel_size / u_resolution;
    fragColor = vec4(
        vec3(
            texture(u_input, destination)
        ), 
        1.0
    );
}