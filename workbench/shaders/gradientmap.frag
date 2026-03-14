#version 300 es
precision mediump float;

uniform sampler2D u_texture; 
uniform sampler2D u_gradientTexture; // gradient
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, vUv);

  // Calculate brightness/luminance (perceived brightness)
  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Look up the gradient color at this brightness level
  // Use brightness as horizontal coordinate, 0.5 as vertical (1D gradient stored as 2D texture)
  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));

  fragColor = gradientColor.rgba;
}
