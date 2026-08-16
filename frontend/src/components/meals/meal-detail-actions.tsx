"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
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
      <Link
        href={`/meals/${mealId}/edit`}
        className="button-secondary button-compact"
      >
        <PencilSimpleIcon size={16} weight="bold" aria-hidden="true" />
        Edit
      </Link>
      <button
        type="button"
        className="button-secondary button-compact"
        onClick={() => setDeleteOpen(true)}
      >
        <TrashIcon size={16} weight="bold" aria-hidden="true" />
        Delete
      </button>
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
