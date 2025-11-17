precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_sourceColor;
uniform vec4 u_targetColor;
uniform float u_threshold;

varying vec2 v_texCoord;

void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);

    float colorDiff = distance(texColor.rgb, u_sourceColor) / 2.;

    if (colorDiff < u_threshold) {
        gl_FragColor = u_targetColor;   
    } else {
        gl_FragColor = texColor;
    }
}
