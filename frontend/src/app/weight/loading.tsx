import { AppShell } from "@/components/app-shell";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";

export default function LoadingWeight() {
  return (
    <AppShell activeDestination="weight">
      <PageContainer>
        <div aria-busy="true" aria-label="Loading weight">
          <PageHeader title="Weight" />
          <section className="daily-section" aria-label="Weight measurements">
            <div className="history-skeleton" aria-hidden="true">
              <div className="skeleton-metrics">
                {Array.from({ length: 4 }, (_, index) => (
                  <span className="skeleton-line" key={index} />
                ))}
              </div>
              <div className="history-skeleton-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <div className="skeleton-card history-skeleton-row" key={index} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
