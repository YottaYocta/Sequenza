#version 300 es
precision mediump float;

uniform sampler2D u_texture; // input
uniform vec3 u_hslAdjust; // H (degrees), S (0-1), L (0-1) — [0, 0, 0]

in vec2 vUv;
out vec4 fragColor;

vec3 rgb2hsl(vec3 color) {
    float maxC = max(max(color.r, color.g), color.b);
    float minC = min(min(color.r, color.g), color.b);
    float delta = maxC - minC;

    float h = 0.0;
    float s = 0.0;
    float l = (maxC + minC) / 2.0;

    if (delta != 0.0) {
        s = l > 0.5 ? delta / (2.0 - maxC - minC) : delta / (maxC + minC);

        if (color.r == maxC) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
        } else if (color.g == maxC) {
            h = (color.b - color.r) / delta + 2.0;
        } else {
            h = (color.r - color.g) / delta + 4.0;
        }
        h /= 6.0;
    }

    return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    if (s == 0.0) {
        return vec3(l);
    }

    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    return vec3(
        hue2rgb(p, q, h + 1.0/3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0/3.0)
    );
}

void main() {
    vec4 color = texture(u_texture, vUv);

    vec3 hsl = rgb2hsl(color.rgb);

    hsl.x = mod(hsl.x + u_hslAdjust.x / 360.0, 1.0);
    hsl.y = clamp(hsl.y + u_hslAdjust.y, 0.0, 1.0);
    hsl.z = clamp(hsl.z + u_hslAdjust.z, 0.0, 1.0);

    fragColor = vec4(hsl2rgb(hsl), color.a);
}
