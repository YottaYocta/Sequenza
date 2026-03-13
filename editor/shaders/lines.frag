#version 300 es
precision highp float;

uniform float uTime; // time
uniform vec2 uResolution; // [100, 100]
uniform vec2 uMouse;
uniform float uAmplitude;

uniform float uRotation; // [0, 6.28, 0]
uniform float uDensity;  // [10, 200, 30]    
uniform float uThreshold;
uniform vec4 uLineColor; // color [0,0,0,0]

uniform sampler2D tInputTex; 
uniform float mode; // [0, 1, 1]


in vec2 vUv;
out vec4 fragColor;

const float PI = 3.1415926535897932384626433832795;

/*
angle is in radians
*/
vec2 rotate(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * uv;
}

vec2 invRotate(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * uv;
}

vec2 rotateCenter(vec2 uv, float angle) {
    return rotate(uv - vec2(.5), uRotation) + vec2(.5);
}

void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 uvInRotatedSpace = invRotate(uv, uRotation);
    vec2 targetPixInRot = vec2(floor(uvInRotatedSpace.x * uDensity + 0.5)/uDensity, uvInRotatedSpace.y);
    vec2 targetPixInRot2 = vec2(floor((uvInRotatedSpace.x) * uDensity + 0.5)/uDensity, uvInRotatedSpace.y  + sin(uMouse) / 20.0);

    float distanceFromTargetInRot = smoothstep(0.0, 1.0, abs(targetPixInRot.x - uvInRotatedSpace.x) * 1.2) * 15.0 / (1.0 + uAmplitude * 5.0);
    float maxDist = 1.0 / uDensity;

    vec2 targetInCart = invRotate(targetPixInRot, -uRotation);
    vec2 targetInCart2 = invRotate(targetPixInRot2, -uRotation);
    vec4 targetColor = (texture(tInputTex, targetInCart) + texture(tInputTex, targetInCart2)) * 0.5;

    float targetLum = pow(dot(targetColor.rgb, vec3(0.299, 0.587, 0.114)), 2.0);

    // 1.0 is solid; should be shaded. 0.0 should be white space
    float solidMask = clamp(targetLum, 0.0, 1.0) < distanceFromTargetInRot * uDensity ? 1.0 : 0.0; 


    if (mode > 0.5) {
        if (solidMask < 0.5) {
            fragColor = vec4(vec3(uLineColor), 1.0);
        } else {
            fragColor = vec4(1.0);
        }
    } else {
        if (solidMask > 0.5) {
            fragColor = vec4(vec3(uLineColor), 1.0);
        } else {
            fragColor = vec4(1.0);
        }
    }

}