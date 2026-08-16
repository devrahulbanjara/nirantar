import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EditWorkoutForm } from "@/components/workout-form/edit-workout-form";
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
          <Link href={`/workouts/${id}`} className="text-link editor-back-link">
            <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
            Workout
          </Link>
          <h1>Edit workout</h1>
        </header>
        {result.status === "unavailable" ? (
          <section className="workouts-state" aria-labelledby="edit-workout-error-title">
            <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
            <div>
              <h2 id="edit-workout-error-title">This workout is unavailable</h2>
              <p>Refresh to try again.</p>
            </div>
          </section>
        ) : (
          <EditWorkoutForm initialWorkout={result.workout} />
        )}
      </main>
    </AppShell>
  );
}
