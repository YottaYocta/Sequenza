#version 300 es
precision mediump float;

// from book of shaders

uniform vec2 u_resolution; // resolution

in vec2 vUv;
out vec4 fragColor;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        438758.5453123);
}

void main() {
    vec2 st = vUv.xy/u_resolution.xy;

    float rnd1 = random(st);
    float rnd2 = random(st + rnd1);
    float rnd3 = random(vec2(rnd1, rnd2));
    float rnd4 = random(vec2(rnd1, rnd3));

    fragColor = vec4(rnd1, rnd3, rnd4,1.0);
}