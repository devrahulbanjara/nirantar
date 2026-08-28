import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { FeedbackState } from "@/components/ui/feedback-state";
import { SessionLogger } from "@/components/workout-form/session-logger";
import { getWorkout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkout(id);

  if (result.status === "not-found") notFound();
  if (result.status === "ready" && result.workout.check_out_at) {
    redirect(`/workouts/${id}`);
  }

  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        {result.status === "unavailable" ? (
          <FeedbackState
            id="session-workout-error-title"
            title="This workout is unavailable"
            description="Refresh to try again."
            icon={<WarningCircleIcon size={24} weight="regular" />}
            tone="warning"
          />
        ) : (
          <SessionLogger initialWorkout={result.workout} />
        )}
      </main>
    </AppShell>
  );
}
