#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 resolution; // [100, 100]
uniform float uTime; // [0, 1, 0.5]
uniform float modSize; // [0, 2, 1]
uniform float tileFactor; // [1,  100, 10]
uniform vec2 uTranslation; // [0,0]

float modSigned(float x, float y) {
    return x - y * sign(x) * floor(abs(x/y));
}

void main() {
    // Map UV coordinates to RGB
    float aspect = resolution.x / resolution.y;
    vec2 uv = vec2(
        (vUv.x + sin((uTranslation.x +vUv.x) * 10.0) * sin(vUv.y + uTranslation.y + uTime / 100.0) * .01 ) * aspect, 
        vUv.y + sin((uTranslation.y+vUv.y) * 7.0) * 0.05 * sin(vUv.x + uTranslation.x + uTime / 100.)) * tileFactor + uTranslation;

    vec2 localUv = vec2(
            mod(uv.x, modSize),
            mod(uv.y,modSize)
        );

    float dist = length(
        localUv - (modSize / 2.0)
    );
 

    fragColor = mix(
        vec4(1.0 - localUv.x, localUv.y,1., 1.0),
        vec4(vec3(1.0), 1.0),
        smoothstep(0.6, 0.5, dist)
    );
}