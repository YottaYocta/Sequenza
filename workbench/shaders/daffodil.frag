#version 300 es

precision highp float;


uniform float uTime; // time
uniform vec2 uResolution; // [100, 100]
uniform vec3 uNotes;
uniform vec2 uMouse;  //mouse
uniform float uMouseDown; 

uniform float uFlowerCount; // [1, 10, 5]
uniform float uFlowerRotation; // [-6, 10, 5]

uniform float uRingRadius; // [-1, 10, 2]
uniform float uRotationOffset; // [1, 10, 5]
uniform float uMouseRotationStrength; // [0, 2, 0.1]
uniform float uMouseScaleFactor; // [0, 1, 0.1]
uniform vec3 uOrigin; // [0, 0.5, -20]

in vec2 vUv;
out vec4 fragColor;

float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}

float sdCappedCylinder(vec3 p, float h, float r)
{
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCappedCone( vec3 p, float h, float r1, float r2 )
{
  vec2 q = vec2( length(p.xz), p.y );
  vec2 k1 = vec2(r2,h);
  vec2 k2 = vec2(r2-r1,2.0*h);
  vec2 ca = vec2(q.x-min(q.x,(q.y<0.0)?r1:r2), abs(q.y)-h);
  vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot(k2, k2), 0.0, 1.0 );
  float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
  return s*sqrt( min(dot(ca, ca),dot(cb, cb)) );
}

float sdEllipsoid(vec3 p, vec3 r)
{
    return (length(p/r) - 1.0) * min(min(r.x,r.y),r.z);
}

float smin(float a, float b, float k)
{
    if (k <= 0.00001) return min(a, b);
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}


float gain( float x, float k ) 
{
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

vec3 rotateAroundAxis(vec3 v, vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return v * c +
           cross(axis, v) * s +
           axis * dot(axis, v) * oc;
}

float petals(vec3 p) 
{
    float petals = 1000.0;
    const int PETAL_COUNT = 6;
    for(int i = 0; i < PETAL_COUNT; i++)
    {
        float angle = float(i) / float(PETAL_COUNT) * 6.28318;
        vec3 rp = p;
        
        float c = cos(angle);
        float s = sin(angle);
        rp.xz = mat2(c, -s, s, c) * rp.xz;

        float dist_from_center = length(rp.xz) * 7.0;

        // adds dip near stem
        rp.y -= 2.0 / pow(1.3 - (1.0-uMouse.y * uMouseScaleFactor) / 10.0, dist_from_center + abs(rp.x) * 5.0);

        // adds tilt between leaves
        rp.y += smoothstep(-0.9, 0.9, rp.x / 4.0) + 1.0;

        // pushes petal tip out
        rp.z += 1.0/(abs(rp.x) + 1.5) + 0.5 + (1.0-uMouse.y * uMouseScaleFactor) / 2.0;

        float petal = sdEllipsoid(rp, vec3(0.1 + (1.0-uMouse.y * uMouseScaleFactor) / 10.0, 0.02, 0.2 + (1.0-uMouse.y * uMouseScaleFactor) / 10.0));
        petals = smin(petals, petal, 0.1);
    }
    return petals;
}

float trumpet(vec3 p) 
{
    float dist_from_center = length(p.xz);
    vec3 p_base = p;
    p_base.y +=1.0;
    float trumpetbase = sdCappedCone(p_base, 0.6 + (1.0-uMouse.y * uMouseScaleFactor), 0.3, 0.1);

    vec3 p_flare = p;
    p_flare.y -= 1.0 / (dist_from_center + 0.4) - 3.2 - (1.0-uMouse.y * uMouseScaleFactor);

    float r = length(p_flare.xz);
    float angle = atan(p_flare.z, p_flare.x);


    float hyper = 1.0 / (r + 10.0);


    p_flare.y += hyper * sin(angle * (angle - 1.6) * 2.0);


    float flare = sdEllipsoid(p_flare, vec3(0.09 + (1.0-uMouse.y * uMouseScaleFactor) / 20.0, 0.01, 0.09 + (1.0-uMouse.y * uMouseScaleFactor) / 20.0));
    float trumpet = smin(trumpetbase, flare, 0.6 + (1.0-uMouse.y * uMouseScaleFactor) / 2.0);

    return trumpet;
}

float leaves(vec3 p) {
    float leaves = 1000.0;
    const int LEAF_COUNT = 5;
    for(int i = 0; i < LEAF_COUNT; i++)
    {
        float angle = float(i) / float(LEAF_COUNT) * 6.28318;
        vec3 rp = p;
        
        float c = cos(angle);
        float s = sin(angle);
        rp.xz = mat2(c, -s, s, c) * rp.xz;

        float dist_from_center = length(rp.xz);

        rp.y += smoothstep(0.0,4.0, dist_from_center) * 20.0 - 15.0; 
        rp.z += angle / 4.0;

        float leaf = sdEllipsoid(rp, vec3(0.5, 2.0, 0.5 + (1.0-uMouse.y * uMouseScaleFactor) / 2.0));
        leaves = smin(leaves, leaf, (1.0-uMouse.y * uMouseScaleFactor));
    }
    return leaves;
}

float single_flower(vec3 p)
{
    float scaledTime = uTime / 2.0;

    float bendStart = 7.0;  
    float bendEnd   = 0.0;  

    float h = clamp((p.y - bendStart) / (bendEnd - bendStart), 0.0, 1.0);

    h = h * h;

    float maxBend = sin(uTime / 2.0) / 10.0 + 0.6 - (gain(uNotes.x - uNotes.z / 2.0, 2.0)-0.5) / 5.0; 

    float bendAngle = h * maxBend;

    //p = rotateAroundAxis(p, vec3(1.0, 0.0, 0.0), 0.2);
    p = rotateAroundAxis(p, vec3(0.0, 1.0, 0.0), uFlowerRotation);

    p = rotateAroundAxis(p, vec3(1.0, 0.0, 0.0), -bendAngle);

    //p.xz += vec2(sin(p.y * 0.2+ scaledTime), cos(p.y * 0.20 + scaledTime)) * smoothstep(-1.0, 0.0, p.y) / 2.0;

    vec3 stemP = p;
    stemP.y -= 6.0;
    float stem = sdCappedCylinder(stemP, 7.0, 0.01);

    float flower = smin(smin(petals(p), trumpet(p), 0.0), leaves(p), 0.0);

    float scene = smin(flower, stem, 1.0);

    return scene;
}

float sceneSDF(vec3 p)
{
    float radius = uRingRadius + (1.0-uMouse.y * uMouseScaleFactor) * 3.0;           

    p = rotateAroundAxis(p, vec3(1.0, 0.0, 0.0), -0.5);
    float angle = atan(p.z, p.x) +.4 + (sin(uTime / 4.0) ) / 10.0 - (gain(uMouse.x, 1.2) - 0.5) * uMouseRotationStrength + uRotationOffset;
    float r = length(p.xz);

    float sectorAngle = 6.28318 / uFlowerCount;

    float id = floor((angle + 3.14159) / sectorAngle);

    float centerAngle = id * sectorAngle + sectorAngle * 0.5 - 3.14159;

    float localAngle = angle - centerAngle;

    vec3 localP;

    localP.x = r * cos(localAngle) - radius;
    localP.z = r * sin(localAngle);
    localP.y = p.y;

    float variation = sin(id * 12.37);

    localP = rotateAroundAxis(localP, vec3(0.0,1.0,0.0), centerAngle);

    localP.y += sin(id * 5.17) * 0.35;

    return single_flower(localP);
}



void main()
{
    vec2 uv = vec2(vUv.x * 2.0 - 1.0, vUv.y * 2.0 - 1.0);
    float aspect = uResolution.x / uResolution.y;
    vec2 resolution = vec2(uv.x * aspect, uv.y) * 0.5;

    vec3 ray_origin = vec3(0, (1.0-uMouse.y * uMouseScaleFactor) * 1.0, (1.0-uMouse.y * uMouseScaleFactor) * 7.0) + uOrigin;
    vec3 ray_direction = normalize(vec3(resolution, 1.0));

    float MAX_DIST = 20.0 + 10.0 * (1.0-uMouse.y * uMouseScaleFactor);
    const int MAX_STEPS = 100;
    float dist_traveled = 0.0;
    int steps = 0;
    int intersected = 0;
    float min_dist = 100.0;

    for(int i = 0; i < MAX_STEPS; i++)
    {
        vec3 current_pos = ray_origin + ray_direction * dist_traveled;

        float distance = sceneSDF(current_pos);

        min_dist = min(distance, min_dist);

        if(distance < 0.1)
        {
            intersected = 1;
            break;
        }

        if(dist_traveled > MAX_DIST)
            break;

        dist_traveled += distance * 0.5;
        steps += 1;
    }

    fragColor = vec4(
        mix(
            vec3(
                //0.0,
                //pow(max(0.0,1.0 - float(min_dist)), 2.0 * uNotes.x + 1.0),
                pow(max(0.0,1.0 - float(min_dist)), 0.5 * uNotes.x + 1.0) * 1.2
                //pow(1.0 - float(steps) / float(MAX_STEPS), 2.0),
                //1.0
                ), 
                vec3(
                pow(max(0.0,1.0 - dist_traveled / MAX_DIST), 1.0) 
                //pow(1.0 - float(steps) / float(MAX_STEPS), 2.0)
                //1.0
                ), 
                pow(min(1.0,(1.0 - uNotes.x - uNotes.z + uNotes.y) + 0.4), 2.0)
            //float(intersected)
        ), 
        1.0
    );
}