import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Patch, Shader, Uniforms } from './renderer';
import { useMemo, type RefObject } from 'react';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';

type ShaderNodeData = {
	shader: Shader;
	patch: Patch;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUnforms: (newUniforms: Uniforms) => void;
};
export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data }: NodeProps<ShaderNode>) => {
	const textureInputs = useMemo<string[]>(() => {
		const matches = data.shader.source.matchAll(/uniform\s+sampler2D\s+(\w+)\s*;/g);
		return Array.from(matches, (m) => m[1]);
	}, [data.shader.source]);

	return (
		<div className="flex gap-2 bg-white border p-4">
			{textureInputs.map((input) => (
				<Handle key={input} id={input} type="target" position={Position.Top}>
					{input}
				</Handle>
			))}
			<div>
				<p>{data.shader.id}</p>
				<UniformForm
					shader={data.shader}
					handleUpdateUniform={(newUniforms) => {
						data.handleUpdateUnforms(newUniforms);
					}}
				></UniformForm>
			</div>
			<div className="flex justify-center items-center ">
				<RendererComponent
					animate
					width={200}
					height={200}
					patch={data.patch}
					uniforms={data.uniforms}
				></RendererComponent>
			</div>
			<Handle id={'out'} type="source" position={Position.Bottom}>
				Out Texture
			</Handle>
		</div>
	);
};
