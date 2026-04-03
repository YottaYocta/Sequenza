#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_threshold;  // [0, 1, 0.5]
uniform float u_feather;    // [0, 0.5, 0.0]
uniform float u_invert;     // [0, 1, 0]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, vUv);
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));

    float v = smoothstep(u_threshold - u_feather, u_threshold + u_feather, lum);
    v = mix(v, 1.0 - v, step(0.5, u_invert));

    fragColor = vec4(vec3(v), c.a);
}
