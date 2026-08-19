"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type ModalVariant = "dialog" | "responsive-dialog";

export function Modal({
  open,
  onClose,
  labelledBy,
  variant = "dialog",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant?: ModalVariant;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handleClose = () => onClose();
    node.addEventListener("close", handleClose);
    return () => node.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      className="modal"
      data-variant={variant}
      aria-labelledby={labelledBy}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-panel">{children}</div>
    </dialog>
  );
}
