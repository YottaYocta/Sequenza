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

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.144));

    vec2 uvRot = rotate(v_texCoord, u_rotation);

    float pos = uvRot.x * u_density;
    float distToCenter = abs(fract(pos) - 0.5);

    float thickness = clamp(1.0 - lum, 0.1, 1.0) * 0.5;

    float lineMask = distToCenter < thickness ? 0.0 : 1.0;

    if(u_colorMode < 0.5) {
        gl_FragColor = vec4(color.rgb * (1.-lineMask), 1.-lineMask);
    } else {
        gl_FragColor = lineMask < 0.5 ? u_singleColor : vec4(1.);
    }
}
