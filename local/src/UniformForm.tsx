import { useState, useRef, useCallback, useEffect, useContext, type FC } from 'react';
import type { Shader, Uniforms } from './renderer';
import { Scrubber } from './Scrubber';
import { EditorContext } from './EditorContext';
import { extractFields, type Field } from './Field';

interface UniformFormProps {
	shader: Shader;
	initialUniforms?: Uniforms;
	handleUpdateUniform: (newUniforms: Uniforms) => void;
}

const toHex = (v: number) =>
	Math.round(Math.min(1, Math.max(0, v)) * 255)
		.toString(16)
		.padStart(2, '0');
const fromHex = (h: string) => parseInt(h, 16) / 255;
const vec3ToHex = ([r, g, b]: [number, number, number]) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;
const hexToVec3 = (hex: string): [number, number, number] => [
	fromHex(hex.slice(1, 3)),
	fromHex(hex.slice(3, 5)),
	fromHex(hex.slice(5, 7))
];

const ColorPickerButton: FC<{ color: string; onChange: (hex: string) => void }> = ({
	color,
	onChange
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	return (
		<div className="relative">
			<button
				onClick={() => inputRef.current?.click()}
				className="w-8 h-5.5 rounded border border-neutral-500 cursor-pointer"
				style={{ backgroundColor: color }}
				title={color}
			/>
			<input
				ref={inputRef}
				type="color"
				value={color}
				onChange={(e) => onChange(e.target.value)}
				className="absolute opacity-0 w-0 h-0 pointer-events-none"
			/>
		</div>
	);
};

const ResetButton: FC<{ onClick: () => void }> = ({ onClick }) => (
	<button
		onClick={onClick}
		className="text-xs text-neutral-600 hover:text-neutral-400 font-mono leading-none select-none px-2"
		title="Reset to default"
	>
		R
	</button>
);

const FloatFieldComponent: FC<{
	data: Field & { type: 'float' };
	handleUpdateField: (updatedField: Field & { type: 'float' }) => void;
}> = ({ data, handleUpdateField }) => (
	<div className="flex items-center py-1.5">
		<FieldLabel name={data.name} type="float" />
		<Scrubber
			value={data.value}
			min={data.min}
			max={data.max}
			step={0.01}
			onChange={(v) => handleUpdateField({ ...data, value: v })}
		/>
		{data.default !== undefined && (
			<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
		)}
	</div>
);

const Vec2FieldComponent: FC<{
	data: Field & { type: 'vec2' };
	handleUpdateField: (updatedField: Field & { type: 'vec2' }) => void;
}> = ({ data, handleUpdateField }) => {
	const update = (i: number, v: number) => {
		const next = [...data.value] as [number, number];
		next[i] = v;
		handleUpdateField({ ...data, value: next });
	};
	return (
		<div className="flex items-center py-1.5">
			<FieldLabel name={data.name} type="vec2" />
			<div className="flex gap-2 flex-wrap">
				{(['x', 'y'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			{data.default !== undefined && (
				<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
			)}
		</div>
	);
};

const Vec3ColorFieldComponent: FC<{
	data: Field & { type: 'vec3' };
	handleUpdateField: (updatedField: Field & { type: 'vec3' }) => void;
}> = ({ data, handleUpdateField }) => (
	<div className="flex items-center py-1.5">
		<FieldLabel name={data.name} type="vec3 color" />
		<ColorPickerButton
			color={vec3ToHex(data.value)}
			onChange={(hex) => handleUpdateField({ ...data, value: hexToVec3(hex) })}
		/>
		{data.default !== undefined && (
			<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
		)}
	</div>
);

const Vec4ColorFieldComponent: FC<{
	data: Field & { type: 'vec4' };
	handleUpdateField: (updatedField: Field & { type: 'vec4' }) => void;
}> = ({ data, handleUpdateField }) => {
	const [r, g, b, a] = data.value;
	return (
		<div className="flex items-center py-1.5">
			<FieldLabel name={data.name} type="vec4 color" />
			<ColorPickerButton
				color={vec3ToHex([r, g, b])}
				onChange={(hex) => {
					const [nr, ng, nb] = hexToVec3(hex);
					handleUpdateField({ ...data, value: [nr, ng, nb, a] });
				}}
			/>
			<Scrubber
				label="a"
				value={a}
				min={0}
				max={1}
				step={0.01}
				onChange={(v) => handleUpdateField({ ...data, value: [r, g, b, v] })}
			/>
			{data.default !== undefined && (
				<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
			)}
		</div>
	);
};

const Vec3FieldComponent: FC<{
	data: Field & { type: 'vec3' };
	handleUpdateField: (updatedField: Field & { type: 'vec3' }) => void;
}> = ({ data, handleUpdateField }) => {
	const update = (i: number, v: number) => {
		const next = [...data.value] as [number, number, number];
		next[i] = v;
		handleUpdateField({ ...data, value: next });
	};
	return (
		<div className="flex items-center py-1.5">
			<FieldLabel name={data.name} type="vec3" />
			<div className="flex gap-2 flex-wrap">
				{(['x', 'y', 'z'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			{data.default !== undefined && (
				<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
			)}
		</div>
	);
};

const Vec4FieldComponent: FC<{
	data: Field & { type: 'vec4' };
	handleUpdateField: (updatedField: Field & { type: 'vec4' }) => void;
}> = ({ data, handleUpdateField }) => {
	const update = (i: number, v: number) => {
		const next = [...data.value] as [number, number, number, number];
		next[i] = v;
		handleUpdateField({ ...data, value: next });
	};
	return (
		<div className="flex items-center gap-2 px-2 py-1.5">
			<FieldLabel name={data.name} type="vec4" />
			<div className="flex gap-2 flex-wrap">
				{(['x', 'y', 'z', 'w'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			{data.default !== undefined && (
				<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default! })} />
			)}
		</div>
	);
};

const TimeFieldComponent: FC<{
	data: Field & { type: 'float'; special: 'time' };
	handleUpdateField: (updatedField: Field & { type: 'float' }) => void;
}> = ({ data, handleUpdateField }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [display, setDisplay] = useState(0);
	const accumulatedRef = useRef(0);
	const startRef = useRef(0);
	const rafRef = useRef(0);
	const handleRef = useRef(handleUpdateField);
	handleRef.current = handleUpdateField;
	const dataRef = useRef(data);
	dataRef.current = data;

	useEffect(() => {
		if (!isPlaying) return;
		startRef.current = Date.now();
		const tick = () => {
			const secs = accumulatedRef.current + (Date.now() - startRef.current) / 1000;
			setDisplay(secs);
			handleRef.current({ ...dataRef.current, value: secs });
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(rafRef.current);
			accumulatedRef.current += (Date.now() - startRef.current) / 1000;
		};
	}, [isPlaying]);

	const toggle = () => setIsPlaying((p) => !p);
	const reset = () => {
		setIsPlaying(false);
		accumulatedRef.current = 0;
		setDisplay(0);
		handleRef.current({ ...dataRef.current, value: 0 });
	};

	return (
		<div className="flex items-center py-1.5">
			<FieldLabel name={data.name} type="float time" />
			<button
				onClick={toggle}
				className="text-xs font-mono text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-sm w-6 h-6 flex items-center justify-center select-none"
				title={isPlaying ? 'Pause' : 'Play'}
			>
				{isPlaying ? '⏸' : '▶'}
			</button>
			<span className="font-mono text-xs text-neutral-500 px-2 w-16 text-right tabular-nums">
				{display.toFixed(2)}s
			</span>
			<ResetButton onClick={reset} />
		</div>
	);
};

const MouseFieldComponent: FC<{
	data: Field & { type: 'vec2'; special: 'mouse' };
	handleUpdateField: (updatedField: Field & { type: 'vec2' }) => void;
}> = ({ data, handleUpdateField }) => {
	const { mousePosition } = useContext(EditorContext);
	const [pos, setPos] = useState<[number, number]>([0, 0]);
	const handleRef = useRef(handleUpdateField);
	handleRef.current = handleUpdateField;
	const dataRef = useRef(data);
	dataRef.current = data;

	useEffect(() => {
		let rafId: number;
		const tick = () => {
			const p: [number, number] = [mousePosition.current[0], mousePosition.current[1]];
			setPos(p);
			handleRef.current({ ...dataRef.current, value: p });
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, []);

	return (
		<div className="flex items-center py-1.5">
			<FieldLabel name={data.name} type="vec2 mouse" />
			<div className="flex gap-2">
				{(['x', 'y'] as const).map((axis, i) => (
					<div key={axis} className="flex items-center w-20 relative">
						<span className="absolute left-1 z-10 bg-neutral-200 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
							<p className="text-[11px] font-mono w-3 text-neutral-500 leading-0 -translate-y-0.5 translate-x-0.5">
								{axis}
							</p>
						</span>
						<span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none bg-neutral-100 rounded-sm w-full h-6 flex items-center justify-end px-1 tabular-nums">
							{pos[i].toFixed(3)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

const FieldLabel: FC<{ name: string; type: string }> = ({ name, type }) => (
	<div className="min-w-30 flex flex-col gap-0.5">
		<span className="font-mono text-xs text-neutral-900">{name}</span>
		<span className="font-mono text-[10px] text-neutral-500">{type}</span>
	</div>
);

const applyInitialUniforms = (fields: Field[], initialUniforms?: Uniforms): Field[] => {
	if (!initialUniforms) return fields;
	return fields.map((field) => {
		const saved = initialUniforms[field.name];
		if (saved === undefined) return field;
		return { ...field, value: saved } as Field;
	});
};

const UniformForm: FC<UniformFormProps> = ({ shader, handleUpdateUniform, initialUniforms }) => {
	const [fields, setFields] = useState<Field[]>(() =>
		applyInitialUniforms(extractFields(shader), initialUniforms)
	);

	useEffect(() => {
		setFields(applyInitialUniforms(extractFields(shader), initialUniforms));
	}, [shader]);

	const updateField = useCallback(
		(index: number, updated: Field) => {
			setFields((prev) => {
				const next = [...prev];
				next[index] = updated;
				const uniforms: Uniforms = {};
				for (const f of next) {
					uniforms[f.name] = f.value;
				}
				handleUpdateUniform(uniforms);
				return next;
			});
		},
		[handleUpdateUniform]
	);

	if (fields.length === 0) {
		return (
			<p className="px-2 py-3 font-mono text-xs">
				No uniforms found.{' '}
				<span>
					Add <code className="">// [min, max, default]</code> comments to float uniforms.
				</span>
			</p>
		);
	}

	useEffect(() => {
		if (fields.length > 0) updateField(0, fields[0]);
	}, [shader]);

	return (
		<div className="rounded overflow-hidden">
			{fields.map((field, i) => {
				const key = `${field.name}-${field.type}`;
				switch (field.type) {
					case 'float':
						return field.special === 'time' ? (
							<TimeFieldComponent
								key={key}
								data={field as Field & { type: 'float'; special: 'time' }}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						) : (
							<FloatFieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
					case 'vec2':
						return field.special === 'mouse' ? (
							<MouseFieldComponent
								key={key}
								data={field as Field & { type: 'vec2'; special: 'mouse' }}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						) : (
							<Vec2FieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
					case 'vec3':
						return field.color ? (
							<Vec3ColorFieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						) : (
							<Vec3FieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
					case 'vec4':
						return field.color ? (
							<Vec4ColorFieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						) : (
							<Vec4FieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
				}
			})}
		</div>
	);
};

export default UniformForm;
export type { Field };
