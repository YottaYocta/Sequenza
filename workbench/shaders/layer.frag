#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_texture_1; 
uniform sampler2D u_texture_2; 

void main() {
    vec4 base    = texture(u_texture_2, vUv);
    vec4 overlay = texture(u_texture_1, vUv);

    float outA = overlay.a + base.a * (1.0 - overlay.a);
    vec3  outRGB = outA > 0.0
        ? (overlay.rgb * overlay.a + base.rgb * base.a * (1.0 - overlay.a)) / outA
        : vec3(0.0);

    fragColor = vec4(outRGB, outA);
}
