import { useEffect, useRef, type FC, type ReactNode } from 'react';

interface DialogProps {
	children?: ReactNode;
	open?: true;
	className?: string;
}

export const Dialog: FC<DialogProps> = ({ children, open, className }) => {
	const dialogRef = useRef<HTMLDialogElement | null>(null);

	useEffect(() => {
		if (dialogRef.current !== null) {
			if (open) dialogRef.current.showPopover();
			else dialogRef.current.hidePopover();
		}
	}, [open]);

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;

		const stop = (e: Event) => e.stopPropagation();

		el.addEventListener('wheel', stop);
		el.addEventListener('pointerdown', stop);
		el.addEventListener('mousedown', stop);

		return () => {
			el.removeEventListener('wheel', stop);
			el.removeEventListener('pointerdown', stop);
			el.removeEventListener('mousedown', stop);
		};
	}, []);

	return (
		<dialog
			onWheel={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
			popover={''}
			ref={dialogRef}
			className={`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3xl h-5/6 border border-neutral-300 rounded-lg starting:opacity-0 opacity-100 transition-all transition-discrete ${open ? 'visible' : 'hidden'} ${className}`}
		>
			{children}
		</dialog>
	);
};
