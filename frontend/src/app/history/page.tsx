import { GaugeIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { WeightEntryDialog } from "@/components/weight-entry-dialog";
import { getKathmanduDate } from "@/lib/daily-summary";
import { addDaysToDateString, formatDateShortLabel } from "@/lib/time";
import { getWeightHistory } from "@/lib/weights";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE_DAYS = 90;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? addDaysToDateString(endDate, -DEFAULT_RANGE_DAYS);
  const isDefaultRange = !params.start && !params.end;

  const weightResult = await getWeightHistory(startDate, endDate);
  const todayWeightEntry =
    weightResult.status === "ready"
      ? weightResult.history.entries.find((entry) => entry.measured_on === today)
      : undefined;

  return (
    <AppShell activeDestination="history">
      <main className="workouts-page">
        <header className="workouts-page-heading">
          <h1>History</h1>
          <DateRangeFilter
            basePath="/history"
            startDate={startDate}
            endDate={endDate}
            isDefaultRange={isDefaultRange}
          />
        </header>

        <section className="daily-section" aria-labelledby="weight-history-title">
          <div className="section-heading">
            <h2 id="weight-history-title">Body weight</h2>
            <WeightEntryDialog
              triggerLabel="Log weight"
              triggerClassName="button-secondary button-compact"
              defaultDate={today}
              existing={todayWeightEntry}
            />
          </div>

          {weightResult.status === "unavailable" ? (
            <section className="workouts-state" aria-labelledby="weight-error-title">
              <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
              <div>
                <h2 id="weight-error-title">Body weight history is unavailable</h2>
                <p>Refresh to try again.</p>
              </div>
            </section>
          ) : weightResult.history.entries.length === 0 ? (
            <section className="workouts-state" aria-labelledby="no-weight-title">
              <GaugeIcon size={24} weight="regular" aria-hidden="true" />
              <div>
                <h2 id="no-weight-title">No body weight logged</h2>
                <p>Nothing in this date range yet.</p>
              </div>
            </section>
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

              <ul className="weight-entry-list">
                {weightResult.history.entries
                  .slice()
                  .sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1))
                  .map((entry) => (
                    <li className="weight-entry-row" key={entry.id}>
                      <div>
                        <p className="weight-entry-date">
                          {formatDateShortLabel(entry.measured_on)}
                        </p>
                        {entry.notes ? <p className="field-hint">{entry.notes}</p> : null}
                      </div>
                      <div className="weight-entry-actions">
                        <span className="set-row-value">{Number(entry.weight_kg)} kg</span>
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
      </main>
    </AppShell>
  );
}
