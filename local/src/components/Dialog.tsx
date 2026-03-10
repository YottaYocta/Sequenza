import { useEffect, useRef, type FC, type ReactNode } from 'react';

interface DialogProps {
	children: ReactNode;
	open: boolean;
	className: string;
}

const Dialog: FC<DialogProps> = ({ children, open, className }) => {
	const dialogRef = useRef<HTMLDialogElement | null>(null);

	useEffect(() => {
		if (dialogRef.current !== null) {
			if (open) dialogRef.current.showPopover();
			else dialogRef.current.hidePopover();
		}
	}, [open]);

	return (
		<dialog popover={''} ref={dialogRef} className={`${className}`}>
			{children}
		</dialog>
	);
};
