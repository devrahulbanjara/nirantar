"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { Button } from "@/components/ui/button";
import { deleteMeal } from "@/lib/actions/meals";

export function MealDetailActions({
  mealId,
  name,
  updatedAt,
}: {
  mealId: string;
  name: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="detail-actions">
      <Button
        href={`/meals/${mealId}/edit`}
        variant="secondary"
        size="md"
        icon={PencilSimpleIcon}
      >
        Edit
      </Button>
      <Button
        variant="tertiary"
        size="md"
        tone="danger"
        icon={TrashIcon}
        onClick={() => setDeleteOpen(true)}
      >
        Delete
      </Button>
      <DeleteRecordDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        recordKind="meal"
        recordId={mealId}
        recordLabel={name}
        expectedUpdatedAt={updatedAt}
        onDelete={deleteMeal}
        onDeleted={() => router.push("/meals")}
      />
    </div>
  );
}
