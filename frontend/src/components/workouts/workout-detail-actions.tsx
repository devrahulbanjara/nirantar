"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { Button } from "@/components/ui/button";
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
      <Button
        href={`/workouts/${workoutId}/edit`}
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
