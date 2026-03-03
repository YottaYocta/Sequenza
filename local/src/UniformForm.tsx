import { useState, useRef, useCallback, useEffect, type FC } from 'react';
import type { Shader, Uniforms } from './renderer';

interface UniformFormProps {
	shader: Shader;
	handleUpdateUniform: (newUniforms: Uniforms) => void;
}

type Field =
	| {
			name: string;
			type: 'float';
			min: number;
			max: number;
			default: number;
			value: number;
	  }
	| {
			name: string;
			type: 'vec2';
			default: [number, number];
			value: [number, number];
	  }
	| {
			name: string;
			type: 'vec3';
			default: [number, number, number];
			value: [number, number, number];
	  }
	| {
			name: string;
			type: 'vec4';
			default: [number, number, number, number];
			value: [number, number, number, number];
	  };

/**
 * Parses shader source for uniform declarations with metadata comments.
 *
 * Supported formats:
 *   uniform float var;           // [min, max, default]
 *   uniform vec2 var;            // [[x,y]]
 *   uniform vec3 var;            // [[r,g,b]]
 *   uniform vec4 var;            // [[r,g,b,a]]
 */
const createFields = (shader: Shader): Field[] => {
	const fields: Field[] = [];
	const lines = shader.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		const floatMatch = trimmed.match(/^uniform\s+float\s+(\w+)\s*;.*\/\/\s*\[([^\]]+)\]/);
		if (floatMatch) {
			const name = floatMatch[1];
			const parts = floatMatch[2].split(',').map((s) => parseFloat(s.trim()));
			if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
				const [min, max, def] = parts;
				fields.push({ name, type: 'float', min, max, default: def, value: def });
			}
			continue;
		}

		const vecMatch = trimmed.match(/^uniform\s+(vec[234])\s+(\w+)\s*;.*\/\/\s*\[(\[[^\]]+\])\]/);
		if (vecMatch) {
			const vecType = vecMatch[1] as 'vec2' | 'vec3' | 'vec4';
			const name = vecMatch[2];
			try {
				const parsed = JSON.parse(vecMatch[3]) as number[];
				if (vecType === 'vec2' && parsed.length === 2) {
					const def: [number, number] = [parsed[0], parsed[1]];
					fields.push({ name, type: 'vec2', default: def, value: [...def] });
				} else if (vecType === 'vec3' && parsed.length === 3) {
					const def: [number, number, number] = [parsed[0], parsed[1], parsed[2]];
					fields.push({ name, type: 'vec3', default: def, value: [...def] });
				} else if (vecType === 'vec4' && parsed.length === 4) {
					const def: [number, number, number, number] = [
						parsed[0],
						parsed[1],
						parsed[2],
						parsed[3]
					];
					fields.push({ name, type: 'vec4', default: def, value: [...def] });
				}
			} catch {
				// malformed comment — skip
			}
		}
	}

	return fields;
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

	const hasBounds = isFinite(min) && isFinite(max);
	const fillPct = hasBounds
		? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
		: null;

	return (
		<div className="flex items-center gap-1">
			{label && (
				<span className="text-[10px] font-mono text-neutral-500 w-3 text-right shrink-0">
					{label}
				</span>
			)}
			<div
				onMouseDown={onMouseDown}
				onDoubleClick={onDoubleClick}
				className={[
					'relative inline-flex items-center justify-center',
					'min-w- h-5.5 rounded overflow-hidden select-none',
					'bg-neutral-900 border border-neutral-700',
					isEditing ? 'cursor-text' : 'cursor-ew-resize'
				].join(' ')}
			>
				{fillPct !== null && (
					<div
						className="absolute inset-y-0 left-0 bg-blue-400/10 pointer-events-none"
						style={{ width: `${fillPct}%` }}
					/>
				)}
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
						className="bg-transparent border-none outline-none text-neutral-200 text-[11px] font-mono w-full text-center px-1"
					/>
				) : (
					<span className="text-[11px] font-mono text-neutral-300 px-1.5 pointer-events-none">
						{displayValue}
					</span>
				)}
			</div>
		</div>
	);
};

const FloatFieldComponent: FC<{
	data: Field & { type: 'float' };
	handleUpdateField: (updatedField: Field & { type: 'float' }) => void;
}> = ({ data, handleUpdateField }) => (
	<div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800">
		<FieldLabel name={data.name} type="float" />
		<Scrubber
			value={data.value}
			min={data.min}
			max={data.max}
			step={(data.max - data.min) / 200}
			onChange={(v) => handleUpdateField({ ...data, value: v })}
		/>
		<ResetButton onClick={() => handleUpdateField({ ...data, value: data.default })} />
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
		<div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800">
			<FieldLabel name={data.name} type="vec2" />
			<div className="flex gap-1 flex-wrap">
				{(['x', 'y'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			<ResetButton
				onClick={() => handleUpdateField({ ...data, value: [...data.default] as [number, number] })}
			/>
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
		<div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800">
			<FieldLabel name={data.name} type="vec3" />
			<div className="flex gap-1 flex-wrap">
				{(['x', 'y', 'z'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			<ResetButton
				onClick={() =>
					handleUpdateField({ ...data, value: [...data.default] as [number, number, number] })
				}
			/>
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
		<div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-800">
			<FieldLabel name={data.name} type="vec4" />
			<div className="flex gap-1 flex-wrap">
				{(['x', 'y', 'z', 'w'] as const).map((axis, i) => (
					<Scrubber key={axis} label={axis} value={data.value[i]} onChange={(v) => update(i, v)} />
				))}
			</div>
			<ResetButton
				onClick={() =>
					handleUpdateField({
						...data,
						value: [...data.default] as [number, number, number, number]
					})
				}
			/>
		</div>
	);
};

const FieldLabel: FC<{ name: string; type: string }> = ({ name, type }) => (
	<div className="min-w-30 flex flex-col gap-0.5">
		<span className="font-mono text-xs text-neutral-200">{name}</span>
		<span className="font-mono text-[10px] text-neutral-600">{type}</span>
	</div>
);

const ResetButton: FC<{ onClick: () => void }> = ({ onClick }) => (
	<button
		onClick={onClick}
		title="Reset to default"
		className="text-[10px] text-neutral-600 border border-neutral-800 rounded px-1.5 py-0.5 leading-none cursor-pointer hover:text-neutral-400 hover:border-neutral-600 transition-colors bg-transparent"
	>
		↺
	</button>
);

const UniformForm: FC<UniformFormProps> = ({ shader, handleUpdateUniform }) => {
	const [fields, setFields] = useState<Field[]>(() => createFields(shader));

	useEffect(() => {
		setFields(createFields(shader));
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
			<p className="px-2 py-3 font-mono text-[11px] text-neutral-600">
				No uniforms found.{' '}
				<span>
					Add <code className="text-neutral-500">// [min, max, default]</code> comments to float
					uniforms.
				</span>
			</p>
		);
	}

	return (
		<div className="bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
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
						return (
							<Vec3FieldComponent
								key={key}
								data={field}
								handleUpdateField={(updated) => updateField(i, updated)}
							/>
						);
					case 'vec4':
						return (
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
