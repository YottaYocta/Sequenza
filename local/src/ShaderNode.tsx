import { Position, type Node, type NodeProps } from '@xyflow/react';
import CustomHandle from './CustomHandle';
import type { Shader, Uniforms } from './renderer';
import { useContext, useMemo, useState, type RefObject } from 'react';
import { Scrubber } from './Scrubber';
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

	const [width, setWidth] = useState(200);
	const [height, setHeight] = useState(200);

	const textureInputs = useMemo<string[]>(() => {
		const matches = data.shader.source.matchAll(/uniform\s+sampler2D\s+(\w+)\s*;/g);
		return Array.from(matches, (m) => m[1]);
	}, [data.shader.source]);

	return (
		<div
			className={`
				flex gap-8 bg-white border border-neutral-200 rounded-lg p-6 relative transition 
				${dragging && 'scale-[101%] shadow-lg shadow-neutral-200'}
			`}
		>
			<p className="text-xs text-neutral-500 absolute -top-6">ID: {data.shader.id}</p>
			{textureInputs.map((input) => (
				<CustomHandle key={input} id={input} type="target" position={Position.Top} />
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
			<div className="flex flex-col justify-center items-center gap-2">
				<RendererComponent
					animate
					width={width}
					height={height}
					patch={patches[data.shader.id]}
					uniforms={uniforms}
				></RendererComponent>
				<div className="flex gap-2">
					<Scrubber label="w" value={width} min={1} step={1} onChange={setWidth} />
					<Scrubber label="h" value={height} min={1} step={1} onChange={setHeight} />
				</div>
			</div>
			<CustomHandle id="out" type="source" position={Position.Bottom} />
		</div>
	);
};
