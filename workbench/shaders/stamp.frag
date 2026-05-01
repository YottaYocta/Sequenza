#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input_base;
uniform sampler2D u_stamp_tex;
uniform vec4 u_base_color;   // color
uniform float u_stamp_size;  // [0.1, 50, 1]

uniform float u_grid_scale_x; // [1, 100, 10]
uniform float u_grid_scale_y; // [1, 100, 10]
uniform float u_scan_radius;  // [1, 3, 1]
uniform float u_render_order; // [0, 1, 0]

uniform vec2 u_resolution; // resolution

vec4 over(vec4 dst, vec4 src) {
    float outA = src.a + dst.a * (1.0 - src.a);
    vec3 outRGB = dst.rgb * (1.0 - src.a) + src.rgb * src.a;
    return vec4(outRGB, outA);
}

float sampleStamp(vec2 p, vec2 corner) {
    float aspect = (u_resolution.x / u_grid_scale_x) / (u_resolution.y / u_grid_scale_y);

    vec2 uv = p - corner;
    uv.x *= aspect;

    vec2 local = uv / u_stamp_size + 0.5;

    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0)))) {
        return 0.0;
    }

    return texture(u_stamp_tex, local).a;
}

void main() {
    vec2 gridUv = vUv * vec2(u_grid_scale_x, u_grid_scale_y);

    vec2 cellId  = floor(gridUv);
    vec2 localUv = fract(gridUv);

    vec2 invGrid = vec2(1.0 / u_grid_scale_x, 1.0 / u_grid_scale_y);

    int r     = int(round(u_scan_radius));
    int start = 1 - r;
    int end   = 1 + r;

    bool backToFront = u_render_order > 0.5;
    vec4 col = u_base_color;

    for (int jj = start; jj < end; jj++) {
        for (int ii = start; ii < end; ii++) {
            int i = backToFront ? ii : (end - 1 + start - ii);
            int j = backToFront ? (end - 1 + start - jj) : jj;
            vec2 corner = vec2(float(i), float(j));
            vec2 global = (cellId + corner) * invGrid;
            vec3 color  = texture(u_input_base, global).rgb;
            float alpha = sampleStamp(localUv, corner);
            col = over(col, vec4(color, alpha));
        }
    }

    fragColor = col;
}
