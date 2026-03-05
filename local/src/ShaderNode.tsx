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
export const ShaderNode = ({ data, dragging }: NodeProps<ShaderNode>) => {
	const { patches, uniforms, handleUpdateUniforms } = useContext(EditorContext);

	if (!patches || patches[data.shader.id] === undefined) return null;

	const textureInputs = useMemo<string[]>(() => {
		const matches = data.shader.source.matchAll(/uniform\s+sampler2D\s+(\w+)\s*;/g);
		return Array.from(matches, (m) => m[1]);
	}, [data.shader.source]);

	return (
		<div
			className={`
				flex gap-6 bg-white border border-neutral-200 rounded-lg p-6 relative transition 
				${dragging && 'scale-[101%] shadow-lg shadow-neutral-200'}
			`}
		>
			<p className="text-xs text-neutral-500 absolute -top-6 left-1/2 -translate-x-1/2">
				ID: {data.shader.id}
			</p>
			{textureInputs.map((input) => (
				<Handle key={input} id={input} type="target" position={Position.Top}>
					{input}
				</Handle>
			))}
			<div className="flex flex-col gap-2">
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
