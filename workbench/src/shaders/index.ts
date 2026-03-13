import daffodil from '../../shaders/daffodil.frag?raw';
import diamonds from '../../shaders/diamonds.frag?raw';
import gaussian from '../../shaders/gaussian.frag?raw';
import imageViewer from '../../shaders/imageViewer.frag?raw';
import linear from '../../shaders/linear.frag?raw';
import lines from '../../shaders/lines.frag?raw';

export const staticShaders: Record<string, string> = {
  'daffodil.frag': daffodil,
  'diamonds.frag': diamonds,
  'gaussian.frag': gaussian,
  'imageViewer.frag': imageViewer,
  'linear.frag': linear,
  'lines.frag': lines,
};
