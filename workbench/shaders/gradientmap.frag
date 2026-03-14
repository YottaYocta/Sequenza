#version 300 es
precision mediump float;

uniform sampler2D u_texture; 
uniform sampler2D u_gradientTexture; // gradient
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, vUv);

  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  vec4 gradientColor = texture(u_gradientTexture, vec2(brightness, 0.5));

  fragColor = vec4(gradientColor.rgb, 1.0);
}
