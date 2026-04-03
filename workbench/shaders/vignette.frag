#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_strength;   // [0, 1, 0.5]
uniform float u_radius;     // [0, 2, 0.75]
uniform float u_softness;   // [0, 1, 0.45]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, vUv);

    float dist = length(vUv - 0.5) * 2.0;
    float vig = smoothstep(u_radius, u_radius - u_softness, dist);
    vig = mix(1.0, vig, u_strength);

    fragColor = vec4(c.rgb * vig, c.a);
}
