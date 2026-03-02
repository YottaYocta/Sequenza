import * as twgl from 'twgl.js';

export type Uniforms = Record<string, any>;
export type Shader = string;

export type Connection = { from: number; to: number; input: number };

export type Patch = {
	shaders: Shader[];
	connections: Connection[];
};

const DefaultVertexShader = `#version 300 es

precision highp float;

in vec2 position;
in vec2 texcoord;

out vec2 vUv;

void main() {
    vUv = vec2(texcoord.x, 1.0 - texcoord.y);
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * requires: patch has no disconnected graph nodes
 */
export class Renderer {
	private programs: twgl.ProgramInfo[] = [];
	private fbos: twgl.FramebufferInfo[] = [];
	private renderOrder: number[] = [];
	private dependencyMapping: Map<number, { input: number; from: number }[]> = new Map();
	private quad: twgl.BufferInfo;

	readonly patch: Patch;
	readonly gl: WebGL2RenderingContext;

	uniforms: Uniforms[];

	constructor(context: WebGL2RenderingContext, patch: Patch) {
		this.patch = patch;
		this.gl = context;

		for (let i = 0; i < patch.shaders.length; i++) {
			this.programs.push(twgl.createProgramInfo(this.gl, [DefaultVertexShader, patch.shaders[i]]));
			this.fbos.push(twgl.createFramebufferInfo(this.gl));
		}

		this.quad = twgl.primitives.createXYQuadBufferInfo(this.gl);

		// find topological ordering of graph, determine rendering order, then initialize an fbo for each pass
		const adj = new Map<number, number[]>();
		const inDegree = new Map<number, number>();

		this.uniforms = [];
		for (let i = 0; i < this.patch.shaders.length; i++) {
			adj.set(i, []);
			inDegree.set(i, 0);
			this.dependencyMapping.set(i, []);
			this.uniforms.push({});
		}

		for (const connection of this.patch.connections) {
			adj.get(connection.from)!.push(connection.to);
			inDegree.set(connection.to, inDegree.get(connection.to)! + 1);
			this.dependencyMapping
				.get(connection.to)!
				.push({ input: connection.input, from: connection.from });
		}

		const queue = inDegree.entries().reduce((prev: number[], [to, count]) => {
			if (count === 0) return [...prev, to];
			else return prev;
		}, []);

		while (queue.length > 0) {
			const n = queue.shift()!;
			this.renderOrder.push(n);
			for (const dependent of adj.get(n)!) {
				const dependentDeg = inDegree.get(dependent)! - 1;

				inDegree.set(dependent, dependentDeg);
				if (dependentDeg === 0) {
					queue.push(dependent);
				}
			}
		}

		if (this.renderOrder.length < this.patch.shaders.length) throw Error('Cycle detected in graph');
	}

	render() {
		for (let i = 0; i < this.renderOrder.length; i++) {
			const currentNode = this.renderOrder[i];
			const programInfo = this.programs[currentNode];
			const uniforms: Uniforms = { ...this.uniforms[currentNode] };
			for (const dependency of this.dependencyMapping.get(currentNode)!) {
				uniforms[`u_input_${dependency.input}`] = this.fbos[dependency.from];
			}

			this.gl.useProgram(programInfo.program);
			twgl.setUniforms(programInfo, uniforms);
			twgl.setBuffersAndAttributes(this.gl, programInfo, this.quad);
			if (i !== this.renderOrder.length - 1)
				twgl.bindFramebufferInfo(this.gl, this.fbos[currentNode]);
			else twgl.bindFramebufferInfo(this.gl, null);
			twgl.drawBufferInfo(this.gl, this.quad);
		}
	}

	dispose() {
		for (const programInfo of this.programs) {
			this.gl.deleteProgram(programInfo.program);
		}

		for (const fboInfo of this.fbos) {
			for (const attachment of fboInfo.attachments) {
				if (attachment instanceof WebGLTexture) this.gl.deleteTexture(attachment);
				else if (attachment instanceof WebGLRenderbuffer) this.gl.deleteRenderbuffer(attachment);
			}
			this.gl.deleteFramebuffer(fboInfo.framebuffer);
		}

		if (this.quad.indices) this.gl.deleteBuffer(this.quad.indices);
		for (const attrib of Object.values(this.quad.attribs ?? {})) {
			if (attrib.buffer) this.gl.deleteBuffer(attrib.buffer);
		}
	}
}
