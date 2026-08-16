"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { deleteWorkout } from "@/lib/actions/workouts";

export function WorkoutDetailActions({
  workoutId,
  title,
  updatedAt,
}: {
  workoutId: string;
  title: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="detail-actions">
      <Link
        href={`/workouts/${workoutId}/edit`}
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
        recordKind="workout"
        recordId={workoutId}
        recordLabel={title}
        expectedUpdatedAt={updatedAt}
        onDelete={deleteWorkout}
        onDeleted={() => router.push("/workouts")}
      />
    </div>
  );
}
