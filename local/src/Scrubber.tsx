import { useState, useRef, useCallback, useEffect, type FC } from 'react';

export interface ScrubberProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	onChange: (value: number) => void;
}

export const Scrubber: FC<ScrubberProps> = ({
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
						className="outline-none text-neutral-500 text-xs font-mono bg-neutral-50 border-neutral-200 pl-5 rounded-sm text-right w-full h-full"
					/>
				) : (
					<span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none border-neutral-200 bg-neutral-100 rounded-sm w-full h-full flex items-center justify-end px-1">
						<p>{displayValue}</p>
					</span>
				)}
			</div>
		</div>
	);
};
