"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";

export function StaleConflictDialog({
  open,
  onRefresh,
  onKeepEditing,
}: {
  open: boolean;
  onRefresh: () => Promise<void>;
  onKeepEditing: () => void;
}) {
  const headingId = useId();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      labelledBy={headingId}
      variant="dialog"
    >
      <h2 className="modal-heading" id={headingId}>
        This record changed elsewhere
      </h2>
      <p className="modal-body">
        Someone (or another tab) saved a newer version since you started
        editing. Your changes here are kept — load the latest version to
        retry your save.
      </p>
      <div className="modal-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onKeepEditing}
        >
          Keep editing
        </button>
        <button
          type="button"
          className="button-primary"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          <ArrowClockwiseIcon size={18} weight="bold" aria-hidden="true" />
          {refreshing ? "Loading…" : "Load latest & retry"}
        </button>
      </div>
    </Modal>
  );
}
