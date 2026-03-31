#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform float u_time; // time
uniform vec2 u_resolution; // resolution
uniform float u_speed; // [0, 100, 2]
uniform float u_period; // [0, 100, 2]
uniform float u_amplitude; // [0, 1, 1]


void main() {
    float aspect = u_resolution.x / u_resolution.y;
    float current_x = vUv.x * aspect + u_time * u_speed;
    float value = abs(mod(current_x * u_period, 2.0) - 1.0); 
    value -= 0.5;
    value *= u_amplitude;
    value += 0.5;

    fragColor = vec4(
        vec3(
            value
        ),
        1.0
    );
}