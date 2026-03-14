import chromakey from "../../shaders/chromakey.frag?raw";
import daffodil from "../../shaders/daffodil.frag?raw";
import diamonds from "../../shaders/diamonds.frag?raw";
import gaussian from "../../shaders/gaussian.frag?raw";
import gradientmap from "../../shaders/gradientmap.frag?raw";
import hsl from "../../shaders/hsl.frag?raw";
import imageViewer from "../../shaders/imageViewer.frag?raw";
import linear from "../../shaders/linear.frag?raw";
import lines from "../../shaders/lines.frag?raw";
import rgb from "../../shaders/rgb.frag?raw";

export const staticShaders: Record<string, string> = {
  "chromakey.frag": chromakey,
  "daffodil.frag": daffodil,
  "diamonds.frag": diamonds,
  "gaussian.frag": gaussian,
  "gradientmap.frag": gradientmap,
  "hsl.frag": hsl,
  "imageViewer.frag": imageViewer,
  "linear.frag": linear,
  "lines.frag": lines,
  "rgb.frag": rgb,
};
