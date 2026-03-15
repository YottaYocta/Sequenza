import * as twgl from "twgl.js";

export type Uniforms = Record<string, any>;
export type Shader = {
  id: string;
  name: string;
  source: string;
  resolution: { width: number; height: number };
};
export type TextureUniform = {
  type: "texture";
  src:
    | string
    | HTMLCanvasElement
    | HTMLImageElement
    | HTMLVideoElement
    | HTMLElement;
};

export type GradientStop = { position: number; color: string };

export type GradientUniform = {
  type: "gradient";
  stops: GradientStop[];
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const interpolateHex = (c1: string, c2: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(g1 + (g2 - g1) * t)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(b1 + (b2 - b1) * t)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
};

export const evalGradientAt = (stops: GradientStop[], t: number): string => {
  const clamped = Math.max(0, Math.min(1, t));
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return "#000000";
  if (sorted.length === 1) return sorted[0].color;
  if (clamped <= sorted[0].position) return sorted[0].color;
  if (clamped >= sorted[sorted.length - 1].position)
    return sorted[sorted.length - 1].color;
  let lower = sorted[0],
    upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (clamped >= sorted[i].position && clamped <= sorted[i + 1].position) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }
  const range = upper.position - lower.position;
  const localT = range === 0 ? 0 : (clamped - lower.position) / range;
  return interpolateHex(lower.color, upper.color, localT);
};

export type Connection = { from: string; to: string; input: string };

export type Patch = {
  shaders: Shader[];
  connections: Connection[];
};

const isTexture = (o: unknown): o is TextureUniform => {
  return (
    typeof o === "object" &&
    o !== null &&
    (o as TextureUniform).type === "texture" &&
    "src" in o
  );
};

const isGradient = (o: unknown): o is GradientUniform =>
  typeof o === "object" &&
  o !== null &&
  (o as GradientUniform).type === "gradient";

const DefaultVertexShader = `#version 300 es

precision highp float;

in vec2 position;
in vec2 texcoord;

out vec2 vUv;

void main() {
    vUv = vec2(texcoord.x, texcoord.y);
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * requires: patch has no disconnected graph nodes
 *
 */
export class Renderer {
  private programs: Record<string, twgl.ProgramInfo> = {};
  private fbos: Record<string, twgl.FramebufferInfo> = {};
  private renderOrder: string[] = []; // corresponds with shader id
  private dependencyMapping: Record<string, { input: string; from: string }[]> =
    {};
  private quad: twgl.BufferInfo;
  private textures: Record<string, WebGLTexture> = {};
  private textureSrcs: Record<string, string> = {};
  private gradientCanvases: Record<string, HTMLCanvasElement> = {};
  private defaultTexture: WebGLTexture;

  readonly patch: Patch;
  readonly gl: WebGL2RenderingContext;

  uniforms: Record<string, Uniforms>;

  constructor(context: WebGL2RenderingContext, patch: Patch) {
    this.patch = patch;
    this.gl = context;

    this.defaultTexture = twgl.createTexture(this.gl, {
      minMag: this.gl.NEAREST,
      wrap: this.gl.CLAMP_TO_EDGE,
      auto: false,
    });
    twgl.setTextureFromArray(
      this.gl,
      this.defaultTexture,
      new Uint8Array([0, 0, 0, 255]),
      {
        width: 1,
        height: 1,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        auto: false,
      },
    );

    for (let i = 0; i < patch.shaders.length; i++) {
      const currentShader = patch.shaders[i];
      this.programs[currentShader.id] = twgl.createProgramInfo(this.gl, [
        DefaultVertexShader,
        currentShader.source,
      ]);
      this.fbos[currentShader.id] = twgl.createFramebufferInfo(
        this.gl,
        [
          {
            format: this.gl.RGBA,
            min: this.gl.NEAREST,
            mag: this.gl.NEAREST,
            wrap: this.gl.CLAMP_TO_EDGE,
            auto: false,
          },
        ],
        currentShader.resolution.width,
        currentShader.resolution.height,
      );
    }

    this.quad = twgl.primitives.createXYQuadBufferInfo(this.gl);

    // find topological ordering of graph, determine rendering order, then initialize an fbo for each pass
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    this.uniforms = {};
    for (let i = 0; i < this.patch.shaders.length; i++) {
      const currentShader = this.patch.shaders[i];
      adj[currentShader.id] = [];
      inDegree[currentShader.id] = 0;
      this.dependencyMapping[currentShader.id] = [];
      this.uniforms[currentShader.id] = {};
    }

    for (const connection of this.patch.connections) {
      adj[connection.from].push(connection.to);
      inDegree[connection.to] += 1;
      this.dependencyMapping[connection.to].push({
        input: connection.input,
        from: connection.from,
      });
    }

    const queue = [...Object.entries(inDegree)].reduce(
      (prev: string[], [to, count]) => {
        if (count === 0) return [...prev, to];
        else return prev;
      },
      [],
    );

    while (queue.length > 0) {
      const n = queue.shift()!;
      this.renderOrder.push(n);
      for (const dependent of adj[n]) {
        const dependentDeg = inDegree[dependent] - 1;

        inDegree[dependent] = dependentDeg;
        if (dependentDeg === 0) {
          queue.push(dependent);
        }
      }
    }

    if (this.renderOrder.length < this.patch.shaders.length)
      throw Error("Cycle detected in graph");
  }

  private _getOrCreateTexture(key: string): WebGLTexture {
    if (!this.textures[key]) {
      const tex = twgl.createTexture(this.gl, {
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        auto: false,
      });
      twgl.setTextureFromArray(this.gl, tex, new Uint8Array([0, 0, 0, 255]), {
        width: 1,
        height: 1,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        auto: false,
      });
      this.textures[key] = tex;
    }
    return this.textures[key];
  }

  private _updateGradientUniform(
    key: string,
    gradientUniform: GradientUniform,
  ): WebGLTexture {
    let canvas = this.gradientCanvases[key];
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 1;
      this.gradientCanvases[key] = canvas;
    }
    const ctx = canvas.getContext("2d")!;
    for (let i = 0; i < 256; i++) {
      ctx.fillStyle = evalGradientAt(gradientUniform.stops, i / 255);
      ctx.fillRect(i, 0, 1, 1);
    }
    return this._updateTextureUniform(key, { type: "texture", src: canvas });
  }

  private _updateTextureUniform(
    key: string,
    textureUniform: TextureUniform,
  ): WebGLTexture {
    const tex = this._getOrCreateTexture(key);
    const src = textureUniform.src;

    if (typeof src === "string") {
      if (this.textureSrcs[key] !== src) {
        this.textureSrcs[key] = src;
        const img = new Image();
        img.onload = () => {
          if (this.textures[key] !== tex) return;
          twgl.setTextureFromElement(this.gl, tex, img, {
            minMag: this.gl.NEAREST,
            wrap: this.gl.CLAMP_TO_EDGE,
            auto: false,
          });
        };
        img.src = src;
      }
    } else {
      twgl.setTextureFromElement(this.gl, tex, src as HTMLElement, {
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        auto: false,
      });
    }

    return tex;
  }

  render() {
    for (let i = 0; i < this.renderOrder.length; i++) {
      const currentNode = this.renderOrder[i];
      const programInfo = this.programs[currentNode];
      const uniforms: Uniforms = { ...this.uniforms[currentNode] };

      for (const [key, value] of Object.entries(uniforms)) {
        if (isTexture(value)) {
          uniforms[key] = this._updateTextureUniform(
            `${currentNode}::${key}`,
            value,
          );
        } else if (isGradient(value)) {
          uniforms[key] = this._updateGradientUniform(
            `${currentNode}::${key}`,
            value,
          );
        }
      }

      for (const dependency of this.dependencyMapping[currentNode]) {
        uniforms[dependency.input] = this.fbos[dependency.from].attachments[0];
      }

      this.gl.useProgram(programInfo.program);
      if (i !== this.renderOrder.length - 1)
        twgl.bindFramebufferInfo(this.gl, this.fbos[currentNode]);
      else twgl.bindFramebufferInfo(this.gl, null);
      twgl.setUniforms(programInfo, uniforms);
      twgl.setBuffersAndAttributes(this.gl, programInfo, this.quad);
      twgl.drawBufferInfo(this.gl, this.quad);
    }
  }

  dispose() {
    for (const programInfo of Object.values(this.programs)) {
      this.gl.deleteProgram(programInfo.program);
    }
    this.programs = {};

    for (const fboInfo of Object.values(this.fbos)) {
      for (const attachment of fboInfo.attachments) {
        if (attachment instanceof WebGLTexture)
          this.gl.deleteTexture(attachment);
        else if (attachment instanceof WebGLRenderbuffer)
          this.gl.deleteRenderbuffer(attachment);
      }
      this.gl.deleteFramebuffer(fboInfo.framebuffer);
    }
    this.fbos = {};

    for (const tex of Object.values(this.textures)) {
      this.gl.deleteTexture(tex);
    }
    this.textures = {};
    this.textureSrcs = {};
    this.gradientCanvases = {};
    this.gl.deleteTexture(this.defaultTexture);

    if (this.quad.indices) this.gl.deleteBuffer(this.quad.indices);
    for (const attrib of Object.values(this.quad.attribs ?? {})) {
      if (attrib.buffer) this.gl.deleteBuffer(attrib.buffer);
    }
  }
}
