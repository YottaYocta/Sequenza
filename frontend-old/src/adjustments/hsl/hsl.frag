precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_hslAdjust; // H (degrees), S (0-1), L (0-1)
varying vec2 v_texCoord;

// Convert RGB to HSL
vec3 rgb2hsl(vec3 color) {
  float maxC = max(max(color.r, color.g), color.b);
  float minC = min(min(color.r, color.g), color.b);
  float delta = maxC - minC;

  float h = 0.0;
  float s = 0.0;
  float l = (maxC + minC) / 2.0;

  if (delta != 0.0) {
    s = l > 0.5 ? delta / (2.0 - maxC - minC) : delta / (maxC + minC);

    if (color.r == maxC) {
      h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
    } else if (color.g == maxC) {
      h = (color.b - color.r) / delta + 2.0;
    } else {
      h = (color.r - color.g) / delta + 4.0;
    }
    h /= 6.0;
  }

  return vec3(h, s, l);
}

// Helper function for HSL to RGB conversion
float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

// Convert HSL to RGB
vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;

  float r, g, b;

  if (s == 0.0) {
    r = g = b = l;
  } else {
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    r = hue2rgb(p, q, h + 1.0/3.0);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1.0/3.0);
  }

  return vec3(r, g, b);
}

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);

  // Convert to HSL
  vec3 hsl = rgb2hsl(color.rgb);

  // Apply adjustments
  hsl.x = mod(hsl.x + u_hslAdjust.x / 360.0, 1.0); // Hue wraps around
  hsl.y = clamp(hsl.y + u_hslAdjust.y, 0.0, 1.0);  // Saturation clamped
  hsl.z = clamp(hsl.z + u_hslAdjust.z, 0.0, 1.0);  // Lightness clamped

  // Convert back to RGB
  vec3 rgb = hsl2rgb(hsl);

  gl_FragColor = vec4(rgb, color.a);
}