#version 300 es
precision mediump float;


uniform sampler2D u_input_tex;
uniform vec2 u_resolution; // resolution
uniform float disperse_distance; // [0, 1, 0.1]

in vec2 vUv;
out vec4 fragColor;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        438758.5453123);
}

void main() {
    vec2 aspect = vec2(
        u_resolution.x / u_resolution.y,
        1.0
    );
    vec2 uv = vUv.xy * aspect;

    float rnd1 = random(uv);
    float rnd2 = random(uv.yx);

    fragColor = texture(u_input_tex, 
        (vec2(rnd1, rnd2) * disperse_distance - disperse_distance * 0.5 + uv) 
        / aspect
    ); 
}