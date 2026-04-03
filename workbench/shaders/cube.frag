#version 300 es
precision highp float;

uniform vec2 u_resolution;  // resolution
uniform float u_time;       // time
uniform float u_roundness;    // [0, 0.45, 0.05]
uniform vec3 u_light_dir; // [1,1,0]
uniform vec3 u_rotation_rate; // [1,1,0]
uniform float u_distance;     // [1, 10, 3]

in vec2 vUv;
out vec4 fragColor;

vec3 rotX(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotZ(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float scene(vec3 p) {
    vec3 q = rotX(p, u_time * u_rotation_rate.x);
    q = rotY(q, u_time * u_rotation_rate.y);
    q = rotZ(q, u_time * u_rotation_rate.z);
    return sdRoundBox(q, vec3(0.5 - u_roundness), u_roundness);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 ro = vec3(0.0, 0.0, u_distance);
    vec3 rd = normalize(vec3(uv, -1.5));

    float t = 0.0;
    bool hit = false;
    for (int i = 0; i < 80; i++) {
        float d = scene(ro + rd * t);
        if (d < 0.001) { hit = true; break; }
        if (t > 20.0) break;
        t += d;
    }

    float brightness = 0.0;
    if (hit) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 l = normalize(u_light_dir);
        float diff = max(dot(n, l), 0.0);
        brightness = 0.12 + diff * 0.88;
    }

    fragColor = vec4(vec3(brightness), 1.0);
}
