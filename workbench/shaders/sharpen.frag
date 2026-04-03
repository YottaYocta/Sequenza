#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec2 u_resolution;  // resolution
uniform float u_amount;     // [0, 3, 1]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 px = 1.0 / u_resolution;

    vec4 center = texture(u_texture, vUv);
    vec4 n  = texture(u_texture, vUv + vec2( 0.0,  px.y));
    vec4 s  = texture(u_texture, vUv + vec2( 0.0, -px.y));
    vec4 e  = texture(u_texture, vUv + vec2( px.x,  0.0));
    vec4 w  = texture(u_texture, vUv + vec2(-px.x,  0.0));

    // unsharp: output = center + amount * (center - blur)
    vec4 blur = (n + s + e + w) * 0.25;
    fragColor = clamp(center + u_amount * (center - blur), 0.0, 1.0);
}
