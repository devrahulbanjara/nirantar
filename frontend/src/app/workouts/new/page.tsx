import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/ui/back-button";
import { NewWorkoutForm } from "@/components/workout-form/new-workout-form";
import { getKathmanduDate } from "@/lib/daily-summary";
import { dayHref, parseDayParam } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const date = parseDayParam(params.date, today);

  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        <header className="editor-page-heading">
          <BackButton
            fallbackHref={dayHref("/workouts", date, today)}
            label="Back to workouts"
          />
          <h1>Log workout</h1>
        </header>
        <NewWorkoutForm defaultDate={date} />
      </main>
    </AppShell>
  );
}
