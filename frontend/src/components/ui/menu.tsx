"use client";

import type { Icon } from "@phosphor-icons/react";
import { useId } from "react";

import { Modal } from "@/components/modal";
import { Button, type ButtonTone } from "@/components/ui/button";

export type MenuItem = {
  id: string;
  label: string;
  icon?: Icon;
  tone?: ButtonTone;
  disabled?: boolean;
};

export function Menu({
  open,
  onOpenChange,
  title,
  items,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
}) {
  const headingId = useId();

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      labelledBy={headingId}
      variant="responsive-dialog"
    >
      <h2 className="modal-heading" id={headingId}>
        {title}
      </h2>
      <div className="action-menu">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="tertiary"
            icon={item.icon}
            tone={item.tone}
            disabled={item.disabled}
            fullWidth
            onClick={() => {
              if (item.disabled) return;
              onOpenChange(false);
              onSelect(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
