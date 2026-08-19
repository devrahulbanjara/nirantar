import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/ui/back-button";
import { NewWorkoutForm } from "@/components/workout-form/new-workout-form";

export const dynamic = "force-dynamic";

export default function NewWorkoutPage() {
  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        <header className="editor-page-heading">
          <BackButton fallbackHref="/workouts" label="Back to workouts" />
          <h1>Log workout</h1>
        </header>
        <NewWorkoutForm />
      </main>
    </AppShell>
  );
}
