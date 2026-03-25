#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_source; // texture
uniform vec2 resolution; // resolution
uniform float scale; // [0.1, 3, 1]

void main() {
    ivec2 size = textureSize(u_image_source, 0);
    vec2 aspect = vec2(
        float(size.x) / float(size.y),
        1.0
    );

    vec2 uv = vUv - 0.5;
    uv /= aspect;
    uv *= vec2(
        resolution.x / resolution.y, 1.0
    );
    uv *= scale;
    uv += 0.5; 

    uv.y = 1.0 - uv.y;

    if (
        any(lessThan(uv, vec2(0.0))) ||
        any(greaterThan(uv, vec2(1.0)))
    ) {
        fragColor = vec4(vec3(0.0), 1.0);
        return;
    }

    fragColor = texture(
        u_image_source, 
        vec2(uv.x, uv.y)
    );
}