#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2 resolution; // resolution
uniform float u_dot_size;  // [0, 20, 10]

void main () {
    vec2 destination = vec2(
        floor(vUv.x / u_dot_size * resolution.x),
        floor(vUv.y / u_dot_size * resolution.y)
    ) * u_dot_size / resolution;
    fragColor = vec4(
        vec3(
            texture(u_input, destination)
        ), 
        1.0
    );
}