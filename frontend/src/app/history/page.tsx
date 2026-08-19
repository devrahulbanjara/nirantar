import { GaugeIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackState } from "@/components/ui/feedback-state";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
} from "@/components/ui/page-layout";
import { ViewToggle, type CollectionView } from "@/components/ui/view-toggle";
import { WeightEntryDialog } from "@/components/weight-entry-dialog";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getWeightHistory } from "@/lib/weights";
import { addDaysToDateString, formatDateShortLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE_DAYS = 90;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    start?: string;
    end?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? addDaysToDateString(endDate, -DEFAULT_RANGE_DAYS);
  const isDefaultRange = !params.start && !params.end;
  const view: CollectionView = params.view === "list" ? "list" : "grid";
  const historyParams = {
    start: startDate,
    end: endDate,
  };

  const weightResult = await getWeightHistory(startDate, endDate);
  const todayWeightEntry =
    weightResult.status === "ready"
      ? weightResult.history.entries.find((entry) => entry.measured_on === today)
      : undefined;

  return (
    <AppShell activeDestination="history">
      <PageContainer>
        <PageHeader
          title="History"
          actions={
            <DateRangeFilter
              basePath="/history"
              startDate={startDate}
              endDate={endDate}
              isDefaultRange={isDefaultRange}
              todayDate={today}
              clearBehavior="omit-params"
              extraParams={{ view }}
            />
          }
        />

        <section className="daily-section" aria-labelledby="weight-history-title">
          <SectionHeader
            id="weight-history-title"
            title="Body weight"
            action={
              weightResult.status === "ready" &&
              weightResult.history.entries.length > 0 ? (
                <div className="section-actions">
                  <ViewToggle
                    basePath="/history"
                    view={view}
                    params={historyParams}
                    preferenceKey="nirantar:view:history"
                  />
                  <WeightEntryDialog
                    triggerLabel="Log weight"
                    triggerClassName="button-secondary button-compact"
                    defaultDate={today}
                    existing={todayWeightEntry}
                  />
                </div>
              ) : null
            }
          />

          {weightResult.status === "unavailable" ? (
            <FeedbackState
              id="weight-error-title"
              title="Body weight history is unavailable"
              description="Refresh to try again."
              icon={<WarningCircleIcon size={24} weight="regular" />}
              tone="warning"
            />
          ) : weightResult.history.entries.length === 0 ? (
            <EmptyState
              id="no-weight-title"
              title={
                isDefaultRange
                  ? "No body weight logged"
                  : "No body weight in this range"
              }
              description={
                isDefaultRange
                  ? "Log today’s weight to start your measurement history."
                  : "Nothing was logged in the selected dates."
              }
              icon={<GaugeIcon size={24} weight="regular" />}
              action={
                <WeightEntryDialog
                  triggerLabel="Log weight"
                  triggerClassName="button-primary"
                  defaultDate={today}
                  existing={todayWeightEntry}
                />
              }
            />
          ) : (
            <>
              <dl className="workout-list-metrics detail-metrics">
                <div>
                  <dt>Measurements</dt>
                  <dd>{weightResult.history.measurement_count}</dd>
                </div>
                <div>
                  <dt>First</dt>
                  <dd>
                    {weightResult.history.first_weight_kg
                      ? `${Number(weightResult.history.first_weight_kg)} kg`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Last</dt>
                  <dd>
                    {weightResult.history.last_weight_kg
                      ? `${Number(weightResult.history.last_weight_kg)} kg`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Change</dt>
                  <dd>
                    {weightResult.history.change_kg
                      ? `${Number(weightResult.history.change_kg) > 0 ? "+" : ""}${Number(weightResult.history.change_kg)} kg`
                      : "—"}
                  </dd>
                </div>
              </dl>

              <ul className="weight-entry-list" data-view={view}>
                {weightResult.history.entries
                  .slice()
                  .sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1))
                  .map((entry) => (
                    <li className="weight-entry-row" key={entry.id}>
                      <div>
                        <p className="weight-entry-date">
                          {formatDateShortLabel(entry.measured_on)}
                        </p>
                        {entry.notes ? (
                          <p className="field-hint">{entry.notes}</p>
                        ) : null}
                      </div>
                      <div className="weight-entry-actions">
                        <span className="set-row-value">
                          {Number(entry.weight_kg)} kg
                        </span>
                        <WeightEntryDialog
                          existing={entry}
                          triggerLabel="Edit"
                          triggerClassName="button-secondary button-compact"
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>
      </PageContainer>
    </AppShell>
  );
}
