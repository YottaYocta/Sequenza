#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_in_black;   // [0, 1, 0]
uniform float u_in_white;   // [0, 1, 1]
uniform float u_gamma;      // [0.1, 10, 1]
uniform float u_out_black;  // [0, 1, 0]
uniform float u_out_white;  // [0, 1, 1]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, vUv);

    // input remap
    vec3 rgb = clamp((c.rgb - u_in_black) / max(u_in_white - u_in_black, 0.0001), 0.0, 1.0);

    // gamma
    rgb = pow(rgb, vec3(1.0 / u_gamma));

    // output remap
    rgb = u_out_black + rgb * (u_out_white - u_out_black);

    fragColor = vec4(rgb, c.a);
}
