import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EditWorkoutForm } from "@/components/workout-form/edit-workout-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { getWorkout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkout(id);

  if (result.status === "not-found") notFound();

  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        <header className="editor-page-heading">
          <BackButton fallbackHref={`/workouts/${id}`} label="Back to workout" />
          <h1>Edit workout</h1>
        </header>
        {result.status === "unavailable" ? (
          <FeedbackState
            id="edit-workout-error-title"
            title="This workout is unavailable"
            description="Refresh to try again."
            icon={<WarningCircleIcon size={24} weight="regular" />}
            tone="warning"
          />
        ) : (
          <EditWorkoutForm initialWorkout={result.workout} />
        )}
      </main>
    </AppShell>
  );
}
