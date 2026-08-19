import { MoonIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { SleepEntryDialog } from "@/components/sleep-entry-dialog";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getSleepHistory } from "@/lib/sleep";
import { addDaysToDateString, formatDateLabel, formatKathmanduTime } from "@/lib/time";

export const dynamic = "force-dynamic";
const DEFAULT_RANGE_DAYS = 30;

export default async function SleepPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? addDaysToDateString(endDate, -DEFAULT_RANGE_DAYS);
  const result = await getSleepHistory(startDate, endDate);

  return (
    <AppShell activeDestination="sleep">
      <main className="workouts-page sleep-page">
        <header className="workouts-page-heading">
          <h1>Sleep</h1>
          <div className="page-heading-actions">
            <DateRangeFilter
              basePath="/sleep"
              startDate={startDate}
              endDate={endDate}
              isDefaultRange={!params.start && !params.end}
              todayDate={today}
            />
            <SleepEntryDialog triggerClassName="button-primary" />
          </div>
        </header>
        {!result.ok ? (
          <section className="workouts-state" role="alert">
            <WarningCircleIcon size={24} />
            <div><h2>Sleep history is unavailable</h2><p>Refresh to try again.</p></div>
          </section>
        ) : result.data.entries.length === 0 ? (
          <section className="workouts-state">
            <MoonIcon size={24} />
            <div><h2>No sleep logged</h2><p>Log your first complete sleep interval.</p></div>
          </section>
        ) : (
          <div className="sleep-list">
            {result.data.entries.map((entry) => (
              <article className="sleep-row" key={entry.id}>
                <div>
                  <h2>{entry.sleep_date === today ? "Today" : formatDateLabel(entry.sleep_date)}</h2>
                  <p>{formatKathmanduTime(entry.sleep_start)} – {formatKathmanduTime(entry.sleep_end)}</p>
                </div>
                <dl>
                  <div><dt>Sleep</dt><dd>{Number(entry.hours_slept).toFixed(1)} hrs</dd></div>
                  {entry.quality_rating ? <div><dt>Quality</dt><dd>{entry.quality_rating}/5</dd></div> : null}
                </dl>
                <SleepEntryDialog existing={entry} triggerLabel="Edit" triggerClassName="button-secondary button-compact" />
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
