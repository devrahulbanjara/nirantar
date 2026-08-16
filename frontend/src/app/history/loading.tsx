import { AppShell } from "@/components/app-shell";

export default function LoadingHistory() {
  return (
    <AppShell activeDestination="history">
      <main className="workouts-page" aria-busy="true" aria-label="Loading history">
        <header className="workouts-page-heading">
          <h1>History</h1>
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
