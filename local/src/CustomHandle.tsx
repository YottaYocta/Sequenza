import { Handle, type HandleProps } from '@xyflow/react';
import { useState, type FC } from 'react';

const HANDLE_SIZE = 16;

const CustomHandle: FC<HandleProps> = ({ id, type, position, onConnect }) => {
	const [isConnected, setIsConnected] = useState(false);
	const isSource = type === 'source';

	let classes: string;

	if (isConnected) {
		classes = 'bg-[#78A3C4] border-neutral-700 text-white';
	} else if (isSource) {
		classes =
			'bg-white border-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-800';
	} else {
		classes = 'bg-white border-neutral-300';
	}

	return (
		<Handle
			id={id}
			type={type}
			position={position}
			onConnect={(connection) => {
				setIsConnected(true);
				onConnect?.(connection);
			}}
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
