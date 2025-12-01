precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_rgbAdjust;
varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  vec3 adjusted = color.rgb + u_rgbAdjust / 255.0;
    adjusted = clamp(adjusted, 0.0, 1.0);
  gl_FragColor = vec4(adjusted, color.a);
}