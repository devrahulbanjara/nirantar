"use client";

import { BarbellIcon, PlusIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonSize } from "@/components/ui/button";
import { createWorkout } from "@/lib/actions/workouts";
import { nowOnKathmanduDateIso } from "@/lib/time";

export function StartWorkoutButton({
  date,
  size = "md",
  variant = "primary",
  label = "Start workout",
}: {
  date: string;
  size?: ButtonSize;
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setSaving(true);
    setError(null);
    const result = await createWorkout({
      check_in_at: nowOnKathmanduDateIso(date),
      check_out_at: null,
      exercises: [],
      groups: [],
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/workouts/${result.data.id}/session`);
  }

  return (
    <span className="start-workout-control">
      <Button
        variant={variant}
        size={size}
        icon={variant === "primary" ? PlusIcon : BarbellIcon}
        loading={saving}
        onClick={() => void start()}
      >
        {label}
      </Button>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
