#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_input;
uniform vec2 u_resolution; // resolution
uniform float u_dot_count; // [0, 100, 3]
uniform float u_bias; // [-100, 100, 0]
uniform float u_sensitivity; // [0, 100, 1]
uniform float u_smoothing; // [0, 100, 1]
uniform float u_rotation; // [0, 100, 0]

float lum(vec3 a) {
    return dot(a, vec3(0.299, 0.587, 0.114));
}

float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h*h*h*k*(1.0/6.0);
}

mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(
        c, -s, 
        s,  c  
    );
}

void main() {
    vec2 uv = vUv;

    uv = vec2(
        uv.x * u_resolution.x / u_resolution.y,
        uv.y       
    );

    vec2 rot_uv = rotate2D(u_rotation) * (uv - 0.5) + 0.5;

    vec2 cell_uv = fract(rot_uv * u_dot_count);

    vec2 source_uv = floor(rot_uv * u_dot_count) / u_dot_count;
    source_uv = transpose(rotate2D(u_rotation)) * (source_uv - 0.5) + 0.5;

    float distance = length(
        cell_uv - vec2(0.5)
    );

    vec4 cellColor = texture(
        u_input, 
        (source_uv)
    );
    float distance_to_center = distance - lum(cellColor.rgb) / 2.0;
   
    // right

    vec2 source_right_uv = floor(
        (rot_uv + vec2(2./u_dot_count, 0.0)) * u_dot_count
    ) / u_dot_count;
    source_right_uv = transpose(rotate2D(u_rotation)) * (source_right_uv - 0.5) + 0.5;

    float distance_right = length(
        cell_uv - vec2(1.5, 0.5)
    );

    vec4 rightCellColor = texture(
        u_input,
        source_right_uv
    );
    float distance_to_right_center = distance_right - lum(rightCellColor.rgb) / 2.0;


    // left

    vec2 source_left_uv = floor(
        (rot_uv - vec2(2./u_dot_count, 0.0)) * u_dot_count
    ) / u_dot_count;
    source_left_uv = transpose(rotate2D(u_rotation)) * (source_left_uv - 0.5) + 0.5;

    float distance_left = length(
        cell_uv - vec2(-0.5, 0.5)
    );

    vec4 leftCellColor = texture(
        u_input,
        source_left_uv
    );
    float distance_to_left_center = distance_left - lum(rightCellColor.rgb) / 2.0;


    // up

    vec2 source_up_uv = floor(
        (rot_uv + vec2(0.0, 2./u_dot_count)) * u_dot_count
    ) / u_dot_count;
    source_up_uv = transpose(rotate2D(u_rotation)) * (source_up_uv - 0.5) + 0.5;

    float distance_up = length(
        cell_uv - vec2(0.5, -0.5)
    );

    vec4 upCellColor = texture(
        u_input,
        source_up_uv
    );
    float distance_to_up_center = distance_up - lum(rightCellColor.rgb) / 2.0;



    // down

    vec2 source_down_uv = floor(
        (rot_uv - vec2(0.0, 2./u_dot_count)) * u_dot_count
    ) / u_dot_count;
    source_down_uv = transpose(rotate2D(u_rotation)) * (source_down_uv - 0.5) + 0.5;

    float distance_down = length(
        cell_uv - vec2(0.5, 1.5)
    );

    vec4 downCellColor = texture(
        u_input,
        source_down_uv
    );
    float distance_to_down_center = distance_down - lum(rightCellColor.rgb) / 2.0;

     
    fragColor = vec4(vec3(
        step(
            0.0,
            smin(
                smin(
                    smin(
                        smin(
                            distance_to_center,
                            distance_to_right_center,
                            u_smoothing
                        ),
                        distance_to_left_center, 
                        u_smoothing
                    ),
                    distance_to_up_center,
                    u_smoothing
                ),
                distance_to_down_center,
                u_smoothing
            )
        )
    ), 1.0);

}