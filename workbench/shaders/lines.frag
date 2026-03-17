#version 300 es
precision highp float;

uniform float u_time; // time
uniform vec2 u_resolution; // resolution
uniform vec2 u_mouse;
uniform float u_amplitude;

uniform float u_rotation; // [0, 6.28, 0]
uniform float u_density;  // [10, 200, 30]
uniform float u_threshold;
uniform vec4 u_line_color; // color [0,0,0,0]

uniform sampler2D u_input_tex;
uniform float u_mode; // [0, 1, 1]


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
    return rotate(uv - vec2(.5), u_rotation) + vec2(.5);
}

void main() {
    vec2 uv = vec2(vUv.x, vUv.y);
    vec2 uvInRotatedSpace = invRotate(uv, u_rotation);
    vec2 targetPixInRot = vec2(floor(uvInRotatedSpace.x * u_density + 0.5)/u_density, uvInRotatedSpace.y);
    vec2 targetPixInRot2 = vec2(floor((uvInRotatedSpace.x) * u_density + 0.5)/u_density, uvInRotatedSpace.y  + sin(u_mouse) / 20.0);

    float distanceFromTargetInRot = smoothstep(0.0, 1.0, abs(targetPixInRot.x - uvInRotatedSpace.x) * 1.2) * 15.0 / (1.0 + u_amplitude * 5.0);
    float maxDist = 1.0 / u_density;

    vec2 targetInCart = invRotate(targetPixInRot, -u_rotation);
    vec2 targetInCart2 = invRotate(targetPixInRot2, -u_rotation);
    vec4 targetColor = (texture(u_input_tex, targetInCart) + texture(u_input_tex, targetInCart2)) * 0.5;

    float targetLum = pow(dot(targetColor.rgb, vec3(0.299, 0.587, 0.114)), 2.0);

    // 1.0 is solid; should be shaded. 0.0 should be white space
    float solidMask = clamp(targetLum, 0.0, 1.0) < distanceFromTargetInRot * u_density ? 1.0 : 0.0;


    if (u_mode > 0.5) {
        if (solidMask < 0.5) {
            fragColor = vec4(vec3(u_line_color), 1.0);
        } else {
            fragColor = vec4(1.0);
        }
    } else {
        if (solidMask > 0.5) {
            fragColor = vec4(vec3(u_line_color), 1.0);
        } else {
            fragColor = vec4(1.0);
        }
    }

}