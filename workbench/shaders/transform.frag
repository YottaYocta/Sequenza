#version 300 es
#define PI 3.14159
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D input_tex;
uniform vec2 resolution; // resolution
uniform vec3 rotation; 
uniform vec3 translation; // [0, 0, 1]
uniform vec2 scale; // [1, 1]
uniform vec4 background_color; // color [1, 1, 1, 0]

vec2 rotate(vec2 x, float angle_rad) {
    float cos_val = cos(angle_rad);
    float sin_val = sin(angle_rad);

    return vec2(
        cos_val * x.x - sin_val * x.y,
        sin_val * x.x + cos_val * x.y
    );
}

vec3 rotate3(vec3 v, vec3 rotation) {
    v.yz = rotate(v.yz, rotation.x);
    v.xz = rotate(v.xz, rotation.y);
    v.xy = rotate(v.xy, rotation.z);
    return v;
}

vec2 get_intersection_uv(vec3 ray_direction) {
    // camera facing (0, 0, 1)
    // initial image facing (0, 0, -1)
    vec3 texture_normal = vec3(0.0, 0.0, -1.0);
    vec3 texture_positive_x = vec3(1.0, 0.0, 0.0) * scale.x;
    vec3 texture_positive_y = vec3(0.0, 1.0, 0.0) * scale.y;


    texture_normal = rotate3(texture_normal, rotation);
    texture_positive_x = rotate3(texture_positive_x, rotation);
    texture_positive_y = rotate3(texture_positive_y, rotation);

    float numerator = dot(translation, texture_normal);
    float denominator = dot(ray_direction, texture_normal);
    if (abs(denominator) < 1e-5) {
        return vec2(-1.0);
    }
    float t = numerator / denominator;
    vec3 intersection_point = t * ray_direction;
    vec3 relative_dist = intersection_point - translation;

    float proj_x = dot(relative_dist, texture_positive_x);
    float proj_y = dot(relative_dist, texture_positive_y);

    return vec2(proj_x, proj_y);
}



void main() {
    vec2 aspect = vec2(
        resolution.x / resolution.y,
        1.0
    );

    vec2 uv = (vUv - 0.5) * aspect;

    vec3 ray_direction = normalize(vec3(
        uv,
        1.0
    ));

    vec2 intersection_loc = get_intersection_uv(ray_direction);
    uv = intersection_loc + 0.5;


    if (any(greaterThan(uv, vec2(1.0))) || any(lessThan(uv, vec2(0.0)))) {
        fragColor = clamp(background_color, vec4(0.0), vec4(1.0));
        fragColor.rgb *= fragColor.a;
        return;
    } 
    
    fragColor = texture(input_tex, uv);
}