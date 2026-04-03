import chromakey from "../../shaders/key.frag?raw";
import daffodil from "../../shaders/daffodil.frag?raw";
import dither_bayer from "../../shaders/dither_bayer.frag?raw";
import dots from "../../shaders/dots.frag?raw";
import diamonds from "../../shaders/diamonds.frag?raw";
import gradientmap from "../../shaders/gradientmap.frag?raw";
import hsl from "../../shaders/hsl.frag?raw";
import imageViewer from "../../shaders/imageViewer.frag?raw";
import lines from "../../shaders/lines.frag?raw";
import rgb from "../../shaders/rgb.frag?raw";
import add from "../../shaders/add.frag?raw";
import subtract from "../../shaders/subtract.frag?raw";
import mix from "../../shaders/mix.frag?raw";
import multiply from "../../shaders/multiply.frag?raw";
import divide from "../../shaders/divide.frag?raw";
import radial_blur from "../../shaders/radial_blur.frag?raw";
import directional_blur from "../../shaders/directional_blur.frag?raw";
import noise from "../../shaders/noise.frag?raw";
import dispersion from "../../shaders/dispersion.frag?raw";
import transform3D from "../../shaders/transform.frag?raw";
import ascii from "../../shaders/ascii.frag?raw";
import brightness_contrast from "../../shaders/brightness_contrast.frag?raw";
import chromatic_aberration from "../../shaders/chromatic_aberration.frag?raw";
import cube from "../../shaders/cube.frag?raw";
import dynamic_pixellate from "../../shaders/dynamic_pixellate.frag?raw";
import edge_detect from "../../shaders/edge_detect.frag?raw";
import ellipse from "../../shaders/ellipse.frag?raw";
import emboss from "../../shaders/emboss.frag?raw";
import fbm from "../../shaders/fbm.frag?raw";
import halftone from "../../shaders/halftone.frag?raw";
import levels from "../../shaders/levels.frag?raw";
import mask from "../../shaders/mask.frag?raw";
import mouse_orb from "../../shaders/mouse_orb.frag?raw";
import pixellate from "../../shaders/pixellate.frag?raw";
import posterize from "../../shaders/posterize.frag?raw";
import rect from "../../shaders/rect.frag?raw";
import sharpen from "../../shaders/sharpen.frag?raw";
import sin from "../../shaders/sin.frag?raw";
import threshold from "../../shaders/threshold.frag?raw";
import tile from "../../shaders/tile.frag?raw";
import triangle from "../../shaders/triangle.frag?raw";
import vignette from "../../shaders/vignette.frag?raw";

export const staticShaders: Record<string, string> = {
  // sources
  "image viewer": imageViewer,
  noise: noise,
  fbm: fbm,
  sin: sin,
  cube: cube,
  "mouse orb": mouse_orb,
  daffodil: daffodil,

  // shapes
  ellipse: ellipse,
  rect: rect,
  triangle: triangle,

  // color
  "hue/saturation/value": hsl,
  "color adjust": rgb,
  "brightness/contrast": brightness_contrast,
  levels: levels,
  threshold: threshold,
  posterize: posterize,
  "gradient map": gradientmap,
  "chromatic aberration": chromatic_aberration,

  // blur & sharpen
  "blur (radial)": radial_blur,
  "blur (linear)": directional_blur,
  sharpen: sharpen,

  // filters
  edge_detect: edge_detect,
  emboss: emboss,
  dispersion: dispersion,
  vignette: vignette,

  // stylize
  dots: dots,
  halftone: halftone,
  diamonds: diamonds,
  lines: lines,
  ascii: ascii,
  dither: dither_bayer,
  pixellate: pixellate,
  "pixellate (dynamic)": dynamic_pixellate,

  // blend
  "mix (add)": add,
  "mix (subtract)": subtract,
  "mix (multiply)": multiply,
  "mix (linear)": mix,
  "mix (divide)": divide,
  mask: mask,

  // transform
  "transform 3D": transform3D,
  tile: tile,

  // key
  key: chromakey,
};
