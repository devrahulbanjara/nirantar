"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";

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
        <Button variant="secondary" onClick={onKeepEditing}>
          Keep editing
        </Button>
        <Button
          variant="primary"
          icon={ArrowClockwiseIcon}
          disabled={refreshing}
          loading={refreshing}
          onClick={handleRefresh}
        >
          Load latest & retry
        </Button>
      </div>
    </Modal>
  );
}
