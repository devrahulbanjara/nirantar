import { AppShell } from "@/components/app-shell";
import { PageContainer, PageHeader, SectionHeader } from "@/components/ui/page-layout";

export default function LoadingHistory() {
  return (
    <AppShell activeDestination="history">
      <PageContainer>
        <div aria-busy="true" aria-label="Loading history">
          <PageHeader title="History" />
          <section className="daily-section" aria-labelledby="loading-weight-history">
            <SectionHeader id="loading-weight-history" title="Body weight" />
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
