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

export const staticShaders: Record<string, string> = {
  key: chromakey,
  dither: dither_bayer,
  dots: dots,
  daffodil: daffodil,
  diamonds: diamonds,
  "gradient map": gradientmap,
  "hue/saturation/value": hsl,
  "image viewer": imageViewer,
  "blur (radial)": radial_blur,
  "blur (linear)": directional_blur,
  noise: noise,
  dispersion: dispersion,
  lines: lines,
  "color adjust": rgb,
  "mix (add)": add,
  "mix (subtract)": subtract,
  "mix (multiply)": multiply,
  "mix (linear)": mix,
  "mix (divide)": divide,
};
