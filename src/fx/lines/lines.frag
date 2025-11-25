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

vec2 rotateCenter(vec2 uv, float angle) {
    return rotate(uv - vec2(.5), u_rotation) + vec2(.5);
}

void main() {
    // uv coordinate after rotation by center
    float transformed = v_texCoord.x * u_density + 0.5;
    float targetX = floor(transformed) / u_density;
    vec2 flooredColorUV = vec2(targetX, v_texCoord.y);
    vec2 offsetFromRealUV = vec2(targetX - v_texCoord.x, 0);
    vec2 rotatedOffset = rotate(offsetFromRealUV, u_rotation);
    vec2 rotatedColorUV = v_texCoord + rotatedOffset;

    vec2 uvRot = rotate(v_texCoord - vec2(.5), u_rotation) + vec2(.5);

    // vec4 color = texture2D(u_texture, vec2(floor(uvRot.x * u_density + 0.5) / u_density, uvRot.y));
    vec4 color = texture2D(u_texture, rotatedColorUV);

    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.144));


    // float pos = uvRot.x * u_density;
    // float distToCenter = abs(fract(pos) - 0.5);

    // float thickness = clamp(1.0 - lum, 0.1, 1.0) * 0.5;

    // float lineMask = distToCenter < thickness ? 0.0 : 1.0;

    gl_FragColor = vec4(vec3(lum), 1.0);
}
