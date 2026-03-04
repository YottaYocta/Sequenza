import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Shader, Uniforms } from './renderer';
import { useContext, useMemo, type RefObject } from 'react';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';
import { EditorContext } from './EditorContext';

type ShaderNodeData = {
	shader: Shader;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUnforms: (newUniforms: Uniforms) => void;
};
export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data }: NodeProps<ShaderNode>) => {
	const { patches, uniforms } = useContext(EditorContext);

	const textureInputs = useMemo<string[]>(() => {
		const matches = data.shader.source.matchAll(/uniform\s+sampler2D\s+(\w+)\s*;/g);
		return Array.from(matches, (m) => m[1]);
	}, [data.shader.source]);

	const content = useMemo(() => {
		return (
			<>
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
						patch={patches[data.shader.id]}
						uniforms={uniforms}
					></RendererComponent>
				</div>
			</>
		);
	}, [patches]);

	return (
		<div className="flex gap-2 bg-white border p-4">
			{textureInputs.map((input) => (
				<Handle key={input} id={input} type="target" position={Position.Top}>
					{input}
				</Handle>
			))}
			{content}
			<Handle id={'out'} type="source" position={Position.Bottom}>
				Out Texture
			</Handle>
		</div>
	);
};
