"use client";

import { ArrowClockwiseIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import type { ActionResult } from "@/lib/api";

export function DeleteRecordDialog({
  open,
  onOpenChange,
  recordKind,
  recordId,
  recordLabel,
  expectedUpdatedAt,
  onDelete,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordKind: string;
  recordId: string;
  recordLabel: string;
  expectedUpdatedAt: string;
  onDelete: (
    id: string,
    expectedUpdatedAt: string,
    confirmation: string,
  ) => Promise<ActionResult<unknown>>;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const headingId = useId();
  const inputId = useId();
  const expected = `DELETE ${recordId}`;
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  function close() {
    setValue("");
    setError(null);
    setStale(false);
    onOpenChange(false);
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    setStale(false);
    const result = await onDelete(recordId, expectedUpdatedAt, value);
    setPending(false);
    if (result.ok) {
      onDeleted();
      return;
    }
    setError(result.message);
    if (result.status === 409) {
      setStale(true);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setRefreshing(false);
    setStale(false);
    setError(null);
  }

  return (
    <Modal open={open} onClose={close} labelledBy={headingId} variant="dialog">
      <h2 className="modal-heading" id={headingId}>
        Delete {recordKind}
      </h2>
      <p className="modal-body">
        This permanently deletes <strong>{recordLabel}</strong> and all of its
        data. This cannot be undone.
      </p>
      <div className="field">
        <label className="field-label" htmlFor={inputId}>
          Type <code>{expected}</code> to confirm
        </label>
        <input
          id={inputId}
          className="field-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="modal-actions">
        <button type="button" className="button-secondary" onClick={close}>
          Cancel
        </button>
        {stale ? (
          <button
            type="button"
            className="button-primary"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <ArrowClockwiseIcon size={18} weight="bold" aria-hidden="true" />
            {refreshing ? "Refreshing…" : "Refresh & try again"}
          </button>
        ) : (
          <button
            type="button"
            className="button-destructive"
            disabled={value !== expected || pending}
            onClick={handleDelete}
          >
            <TrashIcon size={18} weight="bold" aria-hidden="true" />
            {pending ? "Deleting…" : `Delete ${recordKind}`}
          </button>
        )}
      </div>
    </Modal>
  );
}
