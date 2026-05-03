#version 300 es
precision highp float;
precision highp int;

in  vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform float uSunAngle;     // [0, 360, 0]
uniform float uSunHeight;    // [0.0, 1.0, 0.3]
uniform float uSunSize;      // [1.0, 512.0, 64.0]
uniform float uAmbient;      // [0.0, 1.0, 0.1]
uniform float uIOR;          // [1.0, 3.0, 1.5]
uniform float uIORVariation; // [0.0, 0.3, 0.05]
uniform float uBumpScale;    // [0.0, 5.0, 1.0]
uniform vec3  uRotation;     // [-360, 360, 0]
uniform float uBounces;      // [1, 8, 4]
uniform float uKeyBackground; // [0.0, 1.0, 0.0]
uniform vec3  uKeyColor;      // color [0, 0, 0]

mat3 rotX(float a) { vec2 sc = vec2(sin(a), cos(a)); return mat3(1,0,0, 0,sc.y,-sc.x, 0,sc.x,sc.y); }
mat3 rotY(float a) { vec2 sc = vec2(sin(a), cos(a)); return mat3(sc.y,0,sc.x, 0,1,0, -sc.x,0,sc.y); }
mat3 rotZ(float a) { vec2 sc = vec2(sin(a), cos(a)); return mat3(sc.y,-sc.x,0, sc.x,sc.y,0, 0,0,1); }

vec3 gSunDir;

vec3 envSample(vec3 d, vec3 sunDir) {
    return vec3(pow(max(dot(d, sunDir), 0.0), uSunSize) * 20.0 + uAmbient);
}

// Full slab test — used for entry hit in main()
vec2 boxIsect(vec3 ro, vec3 rd) {
    vec3 t1 = min((vec3(-0.5) - ro) / rd, (vec3(0.5) - ro) / rd);
    vec3 t2 = max((vec3(-0.5) - ro) / rd, (vec3(0.5) - ro) / rd);
    return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

// Interior-only exit distance — p is guaranteed inside the box
float boxExitDist(vec3 p, vec3 rd) {
    vec3 t2 = max((vec3(-0.5) - p) / rd, (vec3(0.5) - p) / rd);
    return min(min(t2.x, t2.y), t2.z);
}

vec3 boxNorm(vec3 p) {
    vec3 a = abs(p);
    float m = max(a.x, max(a.y, a.z));
    return sign(p) * step(m - 0.001, a);
}

vec2 faceUV(vec3 p, vec3 n) {
    if (abs(n.x) > 0.5) return p.zy + 0.5;
    if (abs(n.y) > 0.5) return p.xz + 0.5;
    return p.xy + 0.5;
}

// Bump only applies to the z+ object-space face
vec3 perturbNorm(vec3 n_geo, vec2 uv) {
    if (n_geo.z < 0.99) return n_geo;
    float angle = texture(uTexture, uv).r * 6.28318530718;
    return normalize(uBumpScale * vec3(cos(angle), sin(angle), 0.0) + n_geo);
}

// Traces R, G, B channels simultaneously through the box (chromatic dispersion)
vec3 traceDispersion(vec3 rd, vec3 n_entry, vec3 p_entry, vec3 iors, int nBounces) {
    vec3 rdR = refract(rd, n_entry, 1.0 / iors.r);
    vec3 rdG = refract(rd, n_entry, 1.0 / iors.g);
    vec3 rdB = refract(rd, n_entry, 1.0 / iors.b);

    // TIR at entry — fall back to reflection
    vec3 refl = envSample(reflect(rd, n_entry), gSunDir);
    vec3 color = vec3(
        dot(rdR, rdR) < 0.5 ? refl.r : 0.0,
        dot(rdG, rdG) < 0.5 ? refl.g : 0.0,
        dot(rdB, rdB) < 0.5 ? refl.b : 0.0
    );
    bvec3 done = bvec3(dot(rdR,rdR) < 0.5, dot(rdG,rdG) < 0.5, dot(rdB,rdB) < 0.5);

    vec3 pR = p_entry + rdR * 0.001;
    vec3 pG = p_entry + rdG * 0.001;
    vec3 pB = p_entry + rdB * 0.001;

    for (int b = 0; b < 8; b++) {
        if (b >= nBounces) break;

        if (!done.r) {
            vec3  pE = pR + rdR * boxExitDist(pR, rdR);
            vec3  nE = perturbNorm(boxNorm(pE), faceUV(pE, boxNorm(pE)));
            vec3  ro = refract(rdR, -nE, iors.r);
            if (dot(ro, ro) > 0.5) { color.r = envSample(ro, gSunDir).r; done.r = true; }
            else { rdR = reflect(rdR, nE); pR = pE + rdR * 0.001; }
        }
        if (!done.g) {
            vec3  pE = pG + rdG * boxExitDist(pG, rdG);
            vec3  nE = perturbNorm(boxNorm(pE), faceUV(pE, boxNorm(pE)));
            vec3  ro = refract(rdG, -nE, iors.g);
            if (dot(ro, ro) > 0.5) { color.g = envSample(ro, gSunDir).g; done.g = true; }
            else { rdG = reflect(rdG, nE); pG = pE + rdG * 0.001; }
        }
        if (!done.b) {
            vec3  pE = pB + rdB * boxExitDist(pB, rdB);
            vec3  nE = perturbNorm(boxNorm(pE), faceUV(pE, boxNorm(pE)));
            vec3  ro = refract(rdB, -nE, iors.b);
            if (dot(ro, ro) > 0.5) { color.b = envSample(ro, gSunDir).b; done.b = true; }
            else { rdB = reflect(rdB, nE); pB = pE + rdB * 0.001; }
        }
        if (all(done)) break;
    }

    if (!done.r) color.r = envSample(rdR, gSunDir).r;
    if (!done.g) color.g = envSample(rdG, gSunDir).g;
    if (!done.b) color.b = envSample(rdB, gSunDir).b;
    return color;
}

void main() {
    vec2 uv   = 2.0 * vUv - 1.0;
    float sa  = uSunAngle * (3.14159265 / 180.0);
    float sinE = clamp(uSunHeight, 0.0, 1.0);
    float cosE = sqrt(max(1.0 - sinE * sinE, 0.0));
    vec3 sunWorld = normalize(vec3(sin(sa) * cosE, sinE, -cos(sa) * cosE));

    vec3 r  = uRotation * (3.14159265 / 180.0);
    mat3 RT = transpose(rotX(r.x) * rotY(r.y) * rotZ(r.z));
    vec3 ro = RT * vec3(0.0, 0.0, 3.0);
    vec3 rd = RT * normalize(vec3(uv, -2.0));
    gSunDir = RT * sunWorld;

    vec2 t = boxIsect(ro, rd);
    if (t.x > t.y || t.y < 0.0) {
        fragColor = vec4(uKeyBackground > 0.5 ? uKeyColor : envSample(rd, gSunDir), 1.0);
        return;
    }

    vec3 nGeo    = boxNorm(ro + rd * t.x);
    vec3 n_entry = perturbNorm(nGeo, faceUV(ro + rd * t.x, nGeo));
    vec3 iors    = vec3(uIOR - uIORVariation, uIOR, uIOR + uIORVariation);

    vec3 color = traceDispersion(rd, n_entry, ro + rd * t.x, iors, int(uBounces));
    color = pow(max(color / (1.0 + color), 0.0), vec3(1.0 / 2.2));
    fragColor = vec4(color, 1.0);
}
