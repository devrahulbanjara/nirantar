import { AppShell, type NavigationDestination } from "@/components/app-shell";

function Lines({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <span className="skeleton-line" data-line={index % 3} key={index} />
  ));
}

export function CollectionSkeleton({
  destination,
  title,
}: {
  destination: NavigationDestination;
  title: string;
}) {
  return (
    <AppShell activeDestination={destination}>
      <main className="page-container" aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
        <header className="page-header">
          <h1>{title}</h1>
          <div className="skeleton-action" aria-hidden="true" />
        </header>
        <div className="skeleton-collection" aria-hidden="true">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </main>
    </AppShell>
  );
}

export function DetailSkeleton({
  destination,
  label,
}: {
  destination: NavigationDestination;
  label: string;
}) {
  return (
    <AppShell activeDestination={destination}>
      <main className="page-container resource-detail-page" aria-busy="true" aria-label={`Loading ${label}`}>
        <div className="skeleton-detail" aria-hidden="true">
          <div className="skeleton-detail-heading"><Lines count={2} /></div>
          <div className="skeleton-metrics"><Lines count={4} /></div>
          <div className="skeleton-detail-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

export function EditorSkeleton({
  destination,
  label,
}: {
  destination: NavigationDestination;
  label: string;
}) {
  return (
    <AppShell activeDestination={destination}>
      <main className="editor-page" aria-busy="true" aria-label={`Loading ${label}`}>
        <div className="skeleton-editor" aria-hidden="true">
          <Lines count={2} />
          <div className="skeleton-field" />
          <div className="skeleton-field" />
          <div className="skeleton-card" />
          <div className="skeleton-action" />
        </div>
      </main>
    </AppShell>
  );
}
