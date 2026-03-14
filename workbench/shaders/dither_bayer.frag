#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform float u_resolution; // [1, 100, 20]
uniform float u_numColors;  // [2, 16, 2]

in vec2 vUv;
out vec4 fragColor;

int bayer(int x, int y) {
    int bayer64[64] = int[64](
         0, 32,  8, 40,  2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44,  4, 36, 14, 46,  6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
         3, 35, 11, 43,  1, 33,  9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47,  7, 39, 13, 45,  5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
    );
    return bayer64[(y % 8) * 8 + (x % 8)];
}

void main() {
    vec2 cell = floor(vUv * u_resolution);
    vec2 cellUv = cell / u_resolution;

    vec4 color = texture(u_texture, cellUv);

    float threshold = (float(bayer(int(cell.x), int(cell.y))) + 0.5) / 64.0 - 0.5;

    float n = max(2.0, u_numColors);
    float step = 1.0 / (n - 1.0);
    vec3 dithered = clamp(round((color.rgb + threshold * step) / step) * step, 0.0, 1.0);

    fragColor = vec4(dithered, color.a);
}
