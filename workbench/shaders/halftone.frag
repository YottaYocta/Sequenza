#version 300 es
precision mediump float;


in vec2 vUv;
out vec4 fragColor;

uniform float u_time; // time
uniform sampler2D u_input;
uniform sampler2D u_offset;

void main () {
    fragColor = vec4(vec3((sin(u_time) + 1.0) / 2.0), 1.0);
}