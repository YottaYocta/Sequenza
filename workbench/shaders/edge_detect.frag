#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec2 u_resolution;  // resolution
uniform float u_strength;   // [0, 5, 1]
uniform float u_invert;     // [0, 1, 0]

in vec2 vUv;
out vec4 fragColor;

float lum(vec2 uv) {
    return dot(texture(u_texture, uv).rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 px = 1.0 / u_resolution;

    // Sobel kernels
    float tl = lum(vUv + vec2(-px.x,  px.y));
    float tc = lum(vUv + vec2( 0.0,   px.y));
    float tr = lum(vUv + vec2( px.x,  px.y));
    float ml = lum(vUv + vec2(-px.x,  0.0));
    float mr = lum(vUv + vec2( px.x,  0.0));
    float bl = lum(vUv + vec2(-px.x, -px.y));
    float bc = lum(vUv + vec2( 0.0,  -px.y));
    float br = lum(vUv + vec2( px.x, -px.y));

    float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
    float gy = -tl - 2.0*tc - tr + bl + 2.0*bc + br;

    float edge = clamp(length(vec2(gx, gy)) * u_strength, 0.0, 1.0);
    edge = mix(edge, 1.0 - edge, step(0.5, u_invert));

    fragColor = vec4(vec3(edge), 1.0);
}
