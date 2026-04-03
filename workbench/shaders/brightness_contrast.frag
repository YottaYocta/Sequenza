#version 300 es
precision mediump float;

uniform sampler2D u_texture;  // input
uniform float u_brightness;   // [-1, 1, 0]
uniform float u_contrast;     // [-1, 1, 0]

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, vUv);

    vec3 rgb = (c.rgb - 0.5) * (1.0 + u_contrast) + 0.5 + u_brightness;

    fragColor = vec4(clamp(rgb, 0.0, 1.0), c.a);
}
