import { useEffect, useRef, useState, type FC, type ReactNode } from "react";

interface DialogProps {
  children?: ReactNode;
  open: boolean;
  className?: string;
  handleOpenChange: (open: boolean) => void;
}

export const Dialog: FC<DialogProps> = ({
  children,
  open,
  className,
  handleOpenChange,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [localOpen, setOpen] = useState<boolean>(open);

  useEffect(() => {
    setOpen(open ? true : false);
  }, [open]);

  useEffect(() => {
    if (dialogRef.current !== null) {
      if (localOpen) dialogRef.current.showModal();
      else dialogRef.current.close();
    }
    handleOpenChange(localOpen);
  }, [localOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3xl h-5/6 border border-neutral-300 rounded-lg starting:opacity-0 opacity-100 transition-all transition-discrete ${localOpen ? "visible" : "hidden"} ${className} nopan nodrag nowheel`}
    >
      {children}
    </dialog>
  );
};
