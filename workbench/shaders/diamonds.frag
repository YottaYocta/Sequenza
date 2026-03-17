#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 u_resolution; // [100, 100]
uniform float u_time; // time
uniform float u_mod_size; // [0, 2, 1]
uniform float u_tile_factor; // [1,  100, 10]
uniform vec2 u_translation; // [0,0]

float modSigned(float x, float y) {
    return x - y * sign(x) * floor(abs(x/y));
}

void main() {
    // Map UV coordinates to RGB
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vec2(
        (vUv.x + sin((u_translation.x +vUv.x) * 10.0) * sin(vUv.y + u_translation.y + u_time / 100.0) * .01 ) * aspect,
        vUv.y + sin((u_translation.y+vUv.y) * 7.0) * 0.05 * sin(vUv.x + u_translation.x + u_time / 100.)) * u_tile_factor + u_translation;

    vec2 localUv = vec2(
            mod(uv.x, u_mod_size),
            mod(uv.y,u_mod_size)
        );

    float dist = length(
        localUv - (u_mod_size / 2.0)
    );


    fragColor = mix(
        vec4(1.0 - localUv.x, localUv.y,1., 1.0),
        vec4(vec3(1.0), 1.0),
        smoothstep(0.6, 0.5, dist)
    );
}