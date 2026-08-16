import { AppShell } from "@/components/app-shell";

export default function LoadingWorkouts() {
  return (
    <AppShell activeDestination="workouts">
      <main className="workouts-page" aria-busy="true" aria-label="Loading workouts">
        <header className="workouts-page-heading">
          <h1>Workouts</h1>
        </header>
        <div className="workout-loading" aria-hidden="true">
          <span className="skeleton-line skeleton-date" />
          <div className="skeleton-card" />
          <span className="skeleton-line skeleton-date" />
          <div className="skeleton-card" />
        </div>
      </main>
    </AppShell>
  );
}
