"use client";

import { ArrowClockwiseIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
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
  ) => Promise<ActionResult<unknown>>;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const headingId = useId();
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  function close() {
    if (pending) return;
    setError(null);
    setStale(false);
    onOpenChange(false);
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    setStale(false);
    const result = await onDelete(recordId, expectedUpdatedAt);
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
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="modal-actions">
        <Button variant="secondary" disabled={pending} onClick={close}>
          Cancel
        </Button>
        {stale ? (
          <Button
            variant="primary"
            icon={ArrowClockwiseIcon}
            disabled={refreshing}
            loading={refreshing}
            onClick={handleRefresh}
          >
            Refresh & try again
          </Button>
        ) : (
          <Button
            variant="destructive"
            icon={TrashIcon}
            disabled={pending}
            loading={pending}
            onClick={handleDelete}
          >
            Delete {recordKind}
          </Button>
        )}
      </div>
    </Modal>
  );
}
