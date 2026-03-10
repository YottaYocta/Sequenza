import { Position, type Node, type NodeProps } from '@xyflow/react';
import CustomHandle from './CustomHandle';
import type { Patch, Shader, Uniforms } from '../lib/renderer';
import { useContext, useEffect, useMemo, useRef, useState, type FC, type RefObject } from 'react';
import { Scrubber } from './Scrubber';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';
import { EditorContext } from './EditorContext';
import { extractFields } from '../lib/Field';
import { Dialog } from './Dialog';
import { exportSequenzaPatch } from '../lib/exportSequenzaPatch';

interface IntegrationDialogProps {
	uniforms: Record<string, Uniforms>;
	patch: Patch;
}

const IntegrationDialog: FC<IntegrationDialogProps> = ({ uniforms, patch }) => {
	const [open, setOpen] = useState(false);
	const installCommand = 'pnpm i @yottayocta/sequenza';
	const generatedCode = exportSequenzaPatch(uniforms, patch);

	return (
		<>
			<button className="button-base hover:bg-neutral-300" onClick={() => setOpen(true)}>
				Export
			</button>
			<Dialog
				open={open}
				handleOpenChange={setOpen}
				className="flex flex-col gap-4 p-6 overflow-y-auto"
			>
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-medium text-neutral-800">Integrate shader</h2>
					<button
						className="text-xs text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
						onClick={() => setOpen(false)}
					>
						Close
					</button>
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-xs text-neutral-500">Install</p>
					<div className="flex items-center gap-2 bg-neutral-50 rounded px-3 py-2">
						<code className="text-xs text-neutral-700 flex-1 select-all">{installCommand}</code>
						<button
							className="text-xs text-neutral-400 hover:text-neutral-700 transition cursor-pointer shrink-0"
							onClick={() => navigator.clipboard.writeText(installCommand)}
						>
							Copy
						</button>
					</div>
				</div>
				<div className="flex flex-col gap-1 flex-1 min-h-0">
					<p className="text-xs text-neutral-500">Component</p>
					<div className="relative flex-1 min-h-0 bg-neutral-50 rounded">
						<button
							className="absolute top-2 right-2 text-xs text-neutral-400 hover:text-neutral-700 transition cursor-pointer z-10"
							onClick={() => navigator.clipboard.writeText(generatedCode)}
						>
							Copy
						</button>
						<textarea
							readOnly
							value={generatedCode}
							className="w-full h-full resize-none bg-transparent text-xs text-neutral-700 font-mono p-3 pr-12 outline-none"
						/>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export type ShaderNodeData = {
	shader: Shader;
	paused: boolean;
	resolution: [number, number];
	uniforms: RefObject<Record<string, Uniforms>>;
};

export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data, selected, id }: NodeProps<ShaderNode>) => {
	const { patches, uniforms, handleUpdateUniforms, handleUpdateNode } = useContext(EditorContext);

	if (!patches || patches[data.shader.id] === undefined) return null;

	const [width, setWidth] = useState(data.resolution[0]);
	const [height, setHeight] = useState(data.resolution[1]);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const copyImage = () => {
		canvasRef.current?.toBlob((blob) => {
			if (blob) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
		});
	};

	const saveImage = () => {
		const url = canvasRef.current?.toDataURL('image/png');
		if (!url) return;
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.shader.name}.png`;
		a.click();
	};

	useEffect(() => {
		handleUpdateNode(id, (snapshot) => {
			return {
				...snapshot,
				resolution: [width, height],
				shader: {
					...snapshot.shader,
					resolution: {
						width,
						height
					}
				}
			};
		});
	}, [width, height]);

	const textureInputs = useMemo<string[]>(() => {
		return extractFields(data.shader)
			.filter((f) => f.type === 'sampler2D' && !f.texture)
			.map((f) => f.name);
	}, [data.shader]);

	return (
		<div
			className={`
				flex gap-8 bg-white rounded-lg p-6 relative transition-[outline] outline-neutral-200 duration-75
				${selected ? 'outline-4' : 'outline-0'}
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
			<div className="flex flex-col justify-center items-start gap-4 ">
				<div className="flex flex-col gap-2">
					<div className="relative max-w-96">
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
							ref={canvasRef}
							animate={!data.paused}
							width={width}
							height={height}
							patch={patches[data.shader.id]}
							uniforms={uniforms}
							className="w-full h-auto"
							style={{ maxWidth: `${(width / height) * 24}rem` }}
						></RendererComponent>
					</div>
					<div className="flex gap-2">
						<Scrubber label="w" value={width} min={1} step={1} onChange={setWidth} />
						<Scrubber label="h" value={height} min={1} step={1} onChange={setHeight} />
					</div>
				</div>
				<div className="flex gap-2">
					<IntegrationDialog uniforms={uniforms.current} patch={patches[data.shader.id]} />
					<button className="button-base hover:bg-neutral-300" onClick={copyImage}>
						Copy
					</button>
					<button className="button-base hover:bg-neutral-300" onClick={saveImage}>
						Save
					</button>
				</div>
			</div>
			<CustomHandle id="out" type="source" position={Position.Bottom} />
		</div>
	);
};
