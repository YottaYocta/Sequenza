precision mediump float;

uniform sampler2D u_texture;
uniform float u_rotation;
uniform float u_density;
uniform float u_colorMode; // 0.0 = dynamicColor, 1.0 = singleColor
uniform vec4 u_singleColor;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);

  // Calculate grayscale using perceived luminance
  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Output grayscale version
  gl_FragColor = vec4(vec3(brightness) + u_singleColor.rgb, color.a);
}