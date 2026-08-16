import { AppShell } from "@/components/app-shell";

export default function LoadingWorkoutDetail() {
  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page" aria-busy="true" aria-label="Loading workout">
        <div className="workout-loading" aria-hidden="true">
          <span className="skeleton-line" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </main>
    </AppShell>
  );
}
