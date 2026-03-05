import { Handle, type HandleProps } from '@xyflow/react';
import { type FC } from 'react';

const HANDLE_SIZE = 16;

const CustomHandle: FC<HandleProps> = ({ id, type, position }) => {
	const isSource = type === 'source';

	let classes: string;

	if (isSource) {
		classes =
			'bg-white border-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-800 bg-[#78A3C4]';
	} else {
		classes = 'bg-white border-neutral-300';
	}

	return (
		<Handle
			id={id}
			type={type}
			position={position}
			style={{
				background: 'none',
				border: 'none',
				width: HANDLE_SIZE,
				height: HANDLE_SIZE
			}}
		>
			<div
				className={`absolute inset-0 rounded-full border flex items-center justify-center text-xs font-mono leading-none pointer-events-none transition-colors ${classes}`}
			/>
		</Handle>
	);
};

export default CustomHandle;
