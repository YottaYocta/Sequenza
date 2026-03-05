import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Shader, Uniforms } from './renderer';
import { useContext, useMemo, type RefObject } from 'react';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';
import { EditorContext } from './EditorContext';

type ShaderNodeData = {
	shader: Shader;
	uniforms: RefObject<Record<string, Uniforms>>;
};

export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data }: NodeProps<ShaderNode>) => {
	const { patches, uniforms, handleUpdateUniforms } = useContext(EditorContext);

	if (!patches || patches[data.shader.id] === undefined) return null;

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
					initialUniforms={uniforms.current[data.shader.id]}
					handleUpdateUniform={(newUniforms) => {
						handleUpdateUniforms(data.shader.id, newUniforms);
					}}
				></UniformForm>
			</div>
			<div className="flex justify-center items-center ">
				<RendererComponent
					animate
					width={200}
					height={200}
					patch={patches[data.shader.id]}
					uniforms={uniforms}
				></RendererComponent>
			</div>
			<Handle id={'out'} type="source" position={Position.Bottom}>
				Out Texture
			</Handle>
		</div>
	);
};
