precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_gradientTexture;
varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);

  // Calculate brightness/luminance (perceived brightness)
  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Look up the gradient color at this brightness level
  // Use brightness as horizontal coordinate, 0.5 as vertical (1D gradient stored as 2D texture)
  vec4 gradientColor = texture2D(u_gradientTexture, vec2(brightness, 0.5));

  gl_FragColor = gradientColor.rgba;
}
