import { AppShell } from "@/components/app-shell";

export default function LoadingMealDetail() {
  return (
    <AppShell activeDestination="meals">
      <main className="editor-page" aria-busy="true" aria-label="Loading meal">
        <div className="workout-loading" aria-hidden="true">
          <span className="skeleton-line" />
          <div className="skeleton-card" />
        </div>
      </main>
    </AppShell>
  );
}
