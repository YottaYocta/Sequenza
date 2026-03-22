#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform float u_blur_radius; // [0, 3, 0.1]
uniform vec2 u_resolution; // resolution
uniform vec2 u_center; // [0.5, 0.5]
uniform float u_blur_sample_count; // [2, 50, 5]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = vUv * aspect;
    vec2 center = u_center * aspect;

    vec2 offset = uv - center;
    float r = atan(offset.y, offset.x);
    float dist = length(offset);

    vec4 result = vec4(0.);

    int count = int(floor(u_blur_sample_count));
    float invCount = 1.0 / float(count);

    for (int i = 0; i < count; i++) {
        float progress = float(i) * invCount;
        float angle = r - u_blur_radius * 0.5 + progress * u_blur_radius;

        vec2 rotated = vec2(cos(angle), sin(angle)) * dist;

        vec2 sample_uv = center + rotated;
        sample_uv /= aspect;

        result += texture(u_texture, sample_uv);
    }

    fragColor = result * invCount;
}
