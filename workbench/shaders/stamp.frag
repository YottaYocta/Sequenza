#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uStampTex;   
uniform sampler2D uInputBase; 
uniform vec4 uBaseColor;  // color
uniform float uStampSize;  // [0.1, 5, 1] 

uniform float uGridScale; // [1, 100, 10]

uniform vec2 u_resolution; // resolution

vec4 over(vec4 dst, vec4 src) {
    float outA = src.a + dst.a * (1.0 - src.a);
    vec3 outRGB = dst.rgb * (1.0 - src.a) + src.rgb * src.a;
    return vec4(outRGB, outA);
}

float sampleStamp(vec2 p, vec2 corner) {
    float aspect = u_resolution.x / u_resolution.y;

    vec2 uv = p - corner;

    uv.x *= aspect;

    vec2 local = uv / uStampSize + 0.5;

    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0)))) {
        return 0.0;
    }

    return texture(uStampTex, local).a;
}
void main() {
    vec2 gridUv = vUv * uGridScale;

    vec2 cellId  = floor(gridUv);
    vec2 localUv = fract(gridUv); 

    vec2 A = vec2(0.0, 0.0);
    vec2 B = vec2(1.0, 0.0);
    vec2 C = vec2(0.0, 1.0);
    vec2 D = vec2(1.0, 1.0);

    vec2 invGrid = vec2(1.0 / uGridScale);

    vec2 globalA = (cellId + A) * invGrid;
    vec2 globalB = (cellId + B) * invGrid;
    vec2 globalC = (cellId + C) * invGrid;
    vec2 globalD = (cellId + D) * invGrid;

    vec3 colorA = texture(uInputBase, globalA).rgb;
    vec3 colorB = texture(uInputBase, globalB).rgb;
    vec3 colorC = texture(uInputBase, globalC).rgb;
    vec3 colorD = texture(uInputBase, globalD).rgb;

    float aA = sampleStamp(localUv, A);
    float aB = sampleStamp(localUv, B);
    float aC = sampleStamp(localUv, C);
    float aD = sampleStamp(localUv, D);

    vec4 col = uBaseColor;

    col = over(col, vec4(colorA, aA));
    col = over(col, vec4(colorB, aB));
    col = over(col, vec4(colorC, aC));
    col = over(col, vec4(colorD, aD));

    fragColor = col;
}