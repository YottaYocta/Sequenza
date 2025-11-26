precision mediump float;

uniform sampler2D u_texture;
uniform float u_size;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    vec2 texelSize = 1.0 / u_resolution;

    vec4 result = vec4(0.0);
    int kernelRadius = int(ceil(u_size));
    int sampleCount = 0;

    // Box blur - simple average of all pixels in the kernel
    for (int x = -25; x <= 25; x++) {
        if (abs(float(x)) > float(kernelRadius)) continue;

        for (int y = -25; y <= 25; y++) {
            if (abs(float(y)) > float(kernelRadius)) continue;

            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec2 sampleCoord = v_texCoord + offset;

            // Clamp to edges
            sampleCoord = clamp(sampleCoord, vec2(0.0), vec2(1.0));

            result += texture2D(u_texture, sampleCoord);
            sampleCount++;
        }
    }

    gl_FragColor = result / float(sampleCount);
}
