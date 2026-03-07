import { Position, type Node, type NodeProps } from '@xyflow/react';
import CustomHandle from './CustomHandle';
import type { Shader, Uniforms } from './renderer';
import { useContext, useMemo, useState, type RefObject } from 'react';
import { Scrubber } from './Scrubber';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';
import { EditorContext } from './EditorContext';
import { extractFields } from './Field';

export type ShaderNodeData = {
	shader: Shader;
	paused: boolean;
	uniforms: RefObject<Record<string, Uniforms>>;
};

export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data, selected, id }: NodeProps<ShaderNode>) => {
	// console.log(data.paused);
	const { patches, uniforms, handleUpdateUniforms, handleUpdateNode } = useContext(EditorContext);

	if (!patches || patches[data.shader.id] === undefined) return null;

	const [width, setWidth] = useState(200);
	const [height, setHeight] = useState(200);

	const textureInputs = useMemo<string[]>(() => {
		return extractFields(data.shader)
			.filter((f) => f.type === 'sampler2D' && !f.texture)
			.map((f) => f.name);
	}, [data.shader]);

	return (
		<div
			className={`
				flex gap-8 bg-white border ${selected ? 'border-neutral-400' : 'border-neutral-200'} rounded-lg p-6 relative transition 
			`}
		>
			<p className="text-xs text-neutral-500 absolute -top-6">ID: {data.shader.id}</p>
			<p className="text-xs text-neutral-500 absolute -top-10">{data.shader.name}</p>
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
			<div className="flex flex-col justify-center items-center gap-2 ">
				<div className="w-full h-full top-0 left-0 relative">
					<button
						className={`absolute w-full h-full group hover:bg-white/10 ${data.paused ? 'bg-white/10' : 'bg-transparent hover:opacity-100 opacity-0'} transition cursor-pointer flex items-center justify-center`}
						onClick={() => {
							handleUpdateNode(id, (snapshot) => {
								return { ...snapshot, paused: !snapshot.paused };
							});
						}}
					>
						<span
							className={` w-min px-1 h-6 group-hover:bg-white/80 ${data.paused ? 'bg-white/50' : 'bg-transparent'} rounded-sm transition flex items-center justify-center`}
						>
							<span className={`h-3 leading-3 text-xs `}>{data.paused ? 'Resume' : 'Pause'}</span>
						</span>
					</button>
					<RendererComponent
						animate={!data.paused}
						width={width}
						height={height}
						patch={patches[data.shader.id]}
						uniforms={uniforms}
					></RendererComponent>
				</div>
				<div className="flex gap-2">
					<Scrubber label="w" value={width} min={1} step={1} onChange={setWidth} />
					<Scrubber label="h" value={height} min={1} step={1} onChange={setHeight} />
				</div>
			</div>
			<CustomHandle id="out" type="source" position={Position.Bottom} />
		</div>
	);
};
