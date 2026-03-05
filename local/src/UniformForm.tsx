import { useState, useRef, useCallback, useEffect, type FC } from 'react';
import type { Shader, Uniforms } from './renderer';

interface UniformFormProps {
	shader: Shader;
	initialUniforms?: Uniforms;
	handleUpdateUniform: (newUniforms: Uniforms) => void;
}

type Field =
	| {
			name: string;
			type: 'float';
			value: number;
			min?: number;
			max?: number;
			default?: number;
	  }
	| {
			name: string;
			type: 'vec2';
			value: [number, number];
			default?: [number, number];
	  }
	| {
			name: string;
			type: 'vec3';
			value: [number, number, number];
			default?: [number, number, number];
			color?: true;
	  }
	| {
			name: string;
			type: 'vec4';
			value: [number, number, number, number];
			default?: [number, number, number, number];
			color?: true;
	  };

// uniform vec3 varname; // color
// uniform vec3 varname; // color [r, g, b]
// uniform vec4 varname; // color
// uniform vec4 varname; // color [r, g, b, a]

/**
 * Parses shader source for uniform declarations with metadata comments.
 *
 * Supported formats:
 *   uniform float var;
 *   uniform vec2 var;
 *   uniform vec3 var;
 *   uniform vec4 var;
 */
const NUM = '([-\\d.]+)';
const SEP = '\\s*,\\s*';

const createFields = (shader: Shader): Field[] => {
	const fields: Field[] = [];
	const lines = shader.source.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		// uniform float name; // [min, max, default]
		const floatMeta = trimmed.match(
			new RegExp(
				`^uniform\\s+float\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`
			)
		);
		if (floatMeta?.[1]) {
			const min = parseFloat(floatMeta[2]);
			const max = parseFloat(floatMeta[3]);
			const def = parseFloat(floatMeta[4]);
			fields.push({ name: floatMeta[1], type: 'float', value: def, min, max, default: def });
			continue;
		}

		const floatMatch = trimmed.match(/^uniform\s+float\s+(\w+)\s*;/);
		if (floatMatch?.[1]) {
			fields.push({ name: floatMatch[1], type: 'float', value: 0 });
			continue;
		}

		// uniform vec2 name; // [x, y]
		const vec2Meta = trimmed.match(
			new RegExp(`^uniform\\s+vec2\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}\\s*\\]`)
		);
		if (vec2Meta?.[1]) {
			const def: [number, number] = [parseFloat(vec2Meta[2]), parseFloat(vec2Meta[3])];
			fields.push({ name: vec2Meta[1], type: 'vec2', value: def, default: def });
			continue;
		}

		// uniform vec3 name; // color [r, g, b]
		const vec3Color = trimmed.match(
			new RegExp(
				`^uniform\\s+vec3\\s+(\\w+)\\s*;.*\\/\\/\\s*color(?:\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\])?`
			)
		);
		if (vec3Color?.[1]) {
			const def: [number, number, number] | undefined =
				vec3Color[2] !== undefined
					? [parseFloat(vec3Color[2]), parseFloat(vec3Color[3]), parseFloat(vec3Color[4])]
					: undefined;
			fields.push({
				name: vec3Color[1],
				type: 'vec3',
				value: def ?? [1, 1, 1],
				color: true,
				...(def && { default: def })
			});
			continue;
		}

		// uniform vec3 name; // [x, y, z]
		const vec3Meta = trimmed.match(
			new RegExp(
				`^uniform\\s+vec3\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`
			)
		);
		if (vec3Meta?.[1]) {
			const def: [number, number, number] = [
				parseFloat(vec3Meta[2]),
				parseFloat(vec3Meta[3]),
				parseFloat(vec3Meta[4])
			];
			fields.push({ name: vec3Meta[1], type: 'vec3', value: def, default: def });
			continue;
		}

		// uniform vec4 name; // color [r, g, b, a]
		const vec4Color = trimmed.match(
			new RegExp(
				`^uniform\\s+vec4\\s+(\\w+)\\s*;.*\\/\\/\\s*color(?:\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\])?`
			)
		);
		if (vec4Color?.[1]) {
			const def: [number, number, number, number] | undefined =
				vec4Color[2] !== undefined
					? [
							parseFloat(vec4Color[2]),
							parseFloat(vec4Color[3]),
							parseFloat(vec4Color[4]),
							parseFloat(vec4Color[5])
						]
					: undefined;
			fields.push({
				name: vec4Color[1],
				type: 'vec4',
				value: def ?? [1, 1, 1, 1],
				color: true,
				...(def && { default: def })
			});
			continue;
		}

		// uniform vec4 name; // [x, y, z, w]
		const vec4Meta = trimmed.match(
			new RegExp(
				`^uniform\\s+vec4\\s+(\\w+)\\s*;.*\\/\\/\\s*\\[\\s*${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\]`
			)
		);
		if (vec4Meta?.[1]) {
			const def: [number, number, number, number] = [
				parseFloat(vec4Meta[2]),
				parseFloat(vec4Meta[3]),
				parseFloat(vec4Meta[4]),
				parseFloat(vec4Meta[5])
			];
			fields.push({ name: vec4Meta[1], type: 'vec4', value: def, default: def });
			continue;
		}

		const vecMatch = trimmed.match(/^uniform\s+(vec[234])\s+(\w+)\s*;/);
		if (vecMatch) {
			const vecType = vecMatch[1] as 'vec2' | 'vec3' | 'vec4';
			const name = vecMatch[2];
			if (vecType === 'vec2') fields.push({ name, type: 'vec2', value: [0, 0] });
			else if (vecType === 'vec3') fields.push({ name, type: 'vec3', value: [0, 0, 0] });
			else if (vecType === 'vec4') fields.push({ name, type: 'vec4', value: [0, 0, 0, 0] });
		}
	}

	return fields;
};

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

interface ScrubberProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	onChange: (value: number) => void;
}

const Scrubber: FC<ScrubberProps> = ({
	value,
	min = -Infinity,
	max = Infinity,
	step = 0.01,
	label,
	onChange
}) => {
	const isDragging = useRef(false);
	const startX = useRef(0);
	const startValue = useRef(0);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const clamp = (v: number) => Math.min(max, Math.max(min, v));

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isEditing) return;
			isDragging.current = true;
			startX.current = e.clientX;
			startValue.current = value;
			e.preventDefault();
		},
		[value, isEditing]
	);

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			if (!isDragging.current) return;
			const delta = (e.clientX - startX.current) * step;
			onChange(clamp(parseFloat((startValue.current + delta).toFixed(6))));
		};
		const onMouseUp = () => {
			isDragging.current = false;
		};
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, [step, min, max, onChange]);

	const onDoubleClick = () => {
		setEditText(String(value));
		setIsEditing(true);
		setTimeout(() => inputRef.current?.select(), 0);
	};

	const commitEdit = () => {
		const parsed = parseFloat(editText);
		if (!isNaN(parsed)) onChange(clamp(parsed));
		setIsEditing(false);
	};

	const displayValue = Number.isInteger(value)
		? value.toFixed(1)
		: value.toFixed(3).replace(/0+$/, '');

	return (
		<div className="flex items-center w-20 relative nodrag">
			{label && (
				<span className="absolute left-1 z-10 bg-neutral-200 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
					<p className="text-[11px] font-mono w-3 text-neutral-500 height-3 leading-0 -translate-y-0.5 translate-x-0.5 ">
						{label}
					</p>
				</span>
			)}
			<div
				onMouseDown={onMouseDown}
				onDoubleClick={onDoubleClick}
				className={[
					'flex items-center justify-center',
					'rounded overflow-hidden select-none w-full h-6',
					isEditing ? 'cursor-text' : 'cursor-ew-resize'
				].join(' ')}
			>
				{isEditing ? (
					<input
						ref={inputRef}
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onBlur={commitEdit}
						onKeyDown={(e) => {
							if (e.key === 'Enter') commitEdit();
							if (e.key === 'Escape') setIsEditing(false);
						}}
						className="outline-none text-neutral-500 text-xs font-mono bg-neutral-50 border border-neutral-200 pl-5 rounded-sm text-right w-full h-full"
					/>
				) : (
					<span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none border-neutral-200 border bg-neutral-50 rounded-sm w-full h-full flex items-center justify-end px-1">
						<p>{displayValue}</p>
					</span>
				)}
			</div>
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
		applyInitialUniforms(createFields(shader), initialUniforms)
	);

	useEffect(() => {
		setFields(applyInitialUniforms(createFields(shader), initialUniforms));
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
						return (
							<FloatFieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
					case 'vec2':
						return (
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
export { createFields };
export type { Field };
