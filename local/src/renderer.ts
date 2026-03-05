import * as twgl from 'twgl.js';

export type Uniforms = Record<string, any>;
export type Shader = { id: string; name: string; source: string };

export type Connection = { from: string; to: string; input: string };

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
 *
 */
export class Renderer {
	private programs: Record<string, twgl.ProgramInfo> = {};
	private fbos: Record<string, twgl.FramebufferInfo> = {};
	private renderOrder: string[] = []; // corresponds with shader id
	private dependencyMapping: Record<string, { input: string; from: string }[]> = {};
	private quad: twgl.BufferInfo;

	readonly patch: Patch;
	readonly gl: WebGL2RenderingContext;

	uniforms: Record<string, Uniforms>;

	constructor(context: WebGL2RenderingContext, patch: Patch) {
		this.patch = patch;
		this.gl = context;

		for (let i = 0; i < patch.shaders.length; i++) {
			const currentShader = patch.shaders[i];
			this.programs[currentShader.id] = twgl.createProgramInfo(this.gl, [
				DefaultVertexShader,
				currentShader.source
			]);
			this.fbos[currentShader.id] = twgl.createFramebufferInfo(this.gl);
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
				from: connection.from
			});
		}

		const queue = [...Object.entries(inDegree)].reduce((prev: string[], [to, count]) => {
			if (count === 0) return [...prev, to];
			else return prev;
		}, []);

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

		if (this.renderOrder.length < this.patch.shaders.length) throw Error('Cycle detected in graph');
	}

	render() {
		for (let i = 0; i < this.renderOrder.length; i++) {
			const currentNode = this.renderOrder[i];
			const programInfo = this.programs[currentNode];
			const uniforms: Uniforms = { ...this.uniforms[currentNode] };
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
				if (attachment instanceof WebGLTexture) this.gl.deleteTexture(attachment);
				else if (attachment instanceof WebGLRenderbuffer) this.gl.deleteRenderbuffer(attachment);
			}
			this.gl.deleteFramebuffer(fboInfo.framebuffer);
		}
		this.fbos = {};

		if (this.quad.indices) this.gl.deleteBuffer(this.quad.indices);
		for (const attrib of Object.values(this.quad.attribs ?? {})) {
			if (attrib.buffer) this.gl.deleteBuffer(attrib.buffer);
		}
	}
}
