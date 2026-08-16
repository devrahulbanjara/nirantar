"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useId } from "react";

import { Modal } from "@/components/modal";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
}) {
  const headingId = useId();

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      labelledBy={headingId}
      variant="dialog"
    >
      <h2 className="modal-heading" id={headingId}>
        {title}
      </h2>
      <p className="modal-body">{body}</p>
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="modal-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button-destructive"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Removing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
