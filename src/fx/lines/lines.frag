precision mediump float;

uniform sampler2D u_texture;
uniform float u_rotation;     // rotation in radians
uniform float u_density;      // line frequency
uniform float u_colorMode;    // 0.0 = dynamicColor, 1.0 = singleColor
uniform vec4 u_singleColor;

varying vec2 v_texCoord;

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
    vec2 uvInRotatedSpace = invRotate(v_texCoord, u_rotation);

    vec2 targetPixInRot = vec2(floor(uvInRotatedSpace.x * u_density + 0.5)/u_density, uvInRotatedSpace.y);

    float distanceFromTargetInRot = abs(targetPixInRot.x - uvInRotatedSpace.x);
    float maxDist = 1.0 / u_density;

    vec2 targetInCart = invRotate(targetPixInRot, -u_rotation);
    vec4 targetColor = texture2D(u_texture, targetInCart);

    float targetLum = dot(targetColor.rgb, vec3(0.299, 0.587, 0.114));
    float solidMask = clamp(targetLum, 0.0, 0.45) < distanceFromTargetInRot * u_density ? 1.0 : 0.0; // 1.0 is solid; should be shaded. 0.0 should be white space

    vec4 lineColor;
    if (u_colorMode < 0.5) {
        lineColor = targetColor;
    } else {
        lineColor = u_singleColor;
    }

    if (solidMask > 0.5) {
        gl_FragColor = lineColor;
    } else {
        gl_FragColor = vec4(1.0);
    }
}
