precision mediump float;

uniform sampler2D u_texture;
uniform float u_rotation;     // rotation in radians
uniform float u_density;      // line frequency
uniform float u_colorMode;    // 0.0 = dynamicColor, 1.0 = singleColor
uniform vec4 u_singleColor;

varying vec2 v_texCoord;

// Rotate a 2D vector
vec2 rotate(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * uv;
}

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    // Convert to perceived luminance
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Rotate UVs for angled lines
    vec2 uvRot = rotate(v_texCoord, u_rotation);

    // Compute distance to nearest line center
    float pos = uvRot.x * u_density;
    float distToCenter = abs(fract(pos) - 0.5);

    // Line thickness based on luminance (darker = thicker)
    float thickness = (1.0 - lum) * 0.5;

    // Basic threshold without anti-aliasing
    float lineMask = distToCenter < thickness ? 0.0 : 1.0;

    // Output color based on mode
    if(u_colorMode < 0.5) {
        // Dynamic color from texture
        gl_FragColor = vec4(vec3(lineMask), 1.0);
    } else {
        // Single color mode
        gl_FragColor = vec4(u_singleColor.rgb * (1.0 - lineMask), u_singleColor.a);
    }
}
