import { AppShell } from "@/components/app-shell";

export default function LoadingMeals() {
  return (
    <AppShell activeDestination="meals">
      <main className="workouts-page" aria-busy="true" aria-label="Loading meals">
        <header className="workouts-page-heading">
          <h1>Meals</h1>
        </header>
        <div className="workout-loading" aria-hidden="true">
          <span className="skeleton-line" />
          <div className="skeleton-card" />
          <span className="skeleton-line" />
          <div className="skeleton-card" />
        </div>
      </main>
    </AppShell>
  );
}
