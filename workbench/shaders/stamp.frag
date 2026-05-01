#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uInputBase;
uniform sampler2D uStampTex;
uniform vec4 uBaseColor;  // color
uniform float uStampSize;  // [0.1, 50, 1]

uniform float uGridScaleX; // [1, 100, 10]
uniform float uGridScaleY; // [1, 100, 10]
uniform float uScanRadius;   // [1, 3, 1]
uniform float uRenderOrder;  // [0, 1, 0]

uniform vec2 u_resolution; // resolution

vec4 over(vec4 dst, vec4 src) {
    float outA = src.a + dst.a * (1.0 - src.a);
    vec3 outRGB = dst.rgb * (1.0 - src.a) + src.rgb * src.a;
    return vec4(outRGB, outA);
}

float sampleStamp(vec2 p, vec2 corner) {
    float aspect = (u_resolution.x / uGridScaleX) / (u_resolution.y / uGridScaleY);

    vec2 uv = p - corner;
    uv.x *= aspect;

    vec2 local = uv / uStampSize + 0.5;

    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0)))) {
        return 0.0;
    }

    return texture(uStampTex, local).a;
}

void main() {
    vec2 gridUv = vUv * vec2(uGridScaleX, uGridScaleY);

    vec2 cellId  = floor(gridUv);
    vec2 localUv = fract(gridUv);

    vec2 invGrid = vec2(1.0 / uGridScaleX, 1.0 / uGridScaleY);

    int r     = int(round(uScanRadius));
    int start = 1 - r;
    int end   = 1 + r;

    bool backToFront = uRenderOrder > 0.5;
    vec4 col = uBaseColor;

    for (int jj = start; jj < end; jj++) {
        for (int ii = start; ii < end; ii++) {
            int i = backToFront ? ii : (end - 1 + start - ii);
            int j = backToFront ? (end - 1 + start - jj) : jj;
            vec2 corner = vec2(float(i), float(j));
            vec2 global = (cellId + corner) * invGrid;
            vec3 color  = texture(uInputBase, global).rgb;
            float alpha = sampleStamp(localUv, corner);
            col = over(col, vec4(color, alpha));
        }
    }

    fragColor = col;
}
