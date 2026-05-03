#version 300 es
precision highp float;

in  vec2 vUv;
out vec4 fragColor;

uniform vec2  iResolution; // resolution
uniform float uScale;      // [0.5, 20.0, 5.0]  cell frequency
uniform float uSeed;       // time  — driven by elapsed time for animation

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                  dot(p, vec2(269.5, 183.3)),
                  dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
}

vec2 nearestCell(vec2 p) {
    vec2 cell = floor(p);
    vec2 best = cell;
    float bestDist = 1e9;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 n  = cell + vec2(float(x), float(y));
            vec2 pt = n + hash2(n);
            float d = length(p - pt);
            if (d < bestDist) { bestDist = d; best = n; }
        }
    }
    return best;
}

vec3 cellColor(vec2 cell) {
    float s0 = floor(uSeed);
    float s1 = s0 + 1.0;
    float t  = smoothstep(0.0, 1.0, fract(uSeed));

    vec3 c0 = hash3(cell + vec2(s0 * 17.3, s0 * 31.7));
    vec3 c1 = hash3(cell + vec2(s1 * 17.3, s1 * 31.7));
    return mix(c0, c1, t);
}

void main() {
    vec2 uv   = vUv * vec2(iResolution.x / iResolution.y, 1.0);
    vec2 cell = nearestCell(uv * uScale);
    fragColor = vec4(cellColor(cell), 1.0);
}
