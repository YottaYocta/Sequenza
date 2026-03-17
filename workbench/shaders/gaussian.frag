#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform float u_size; // [1, 100, 5]
uniform vec2 u_resolution; // resolution

in vec2 vUv;
out vec4 fragColor;

const float PI = 3.1415926535897932384626433832795;

// Gaussian function
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * PI) * sigma);
}

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    float sigma = u_size / 3.0; // Standard deviation based on size

    vec4 result = vec4(0.0);
    float totalWeight = 0.0;

    int kernelRadius = int(ceil(u_size));

    // Two-pass separable Gaussian blur (horizontal + vertical in one pass for simplicity)
    // For better performance, this should be split into two passes, but for this implementation
    // we'll do a 2D kernel
    for (int x = -25; x <= 25; x++) {
        if (abs(float(x)) > float(kernelRadius)) continue;

        for (int y = -25; y <= 25; y++) {
            if (abs(float(y)) > float(kernelRadius)) continue;

            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec2 sampleCoord = vUv + offset;

            // Clamp to edges
            sampleCoord = clamp(sampleCoord, vec2(0.0), vec2(1.0));

            float distance = length(vec2(float(x), float(y)));
            float weight = gaussian(distance, sigma);

            result += texture(u_texture, sampleCoord) * weight;
            totalWeight += weight;
        }
    }

    fragColor = result / totalWeight;
}
