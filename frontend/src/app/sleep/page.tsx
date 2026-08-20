import {
  MoonIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { SleepEntryDialog } from "@/components/sleep-entry-dialog";
import {
  AggregateCard,
  AggregateCardHeader,
  MetricList,
} from "@/components/ui/aggregate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackState } from "@/components/ui/feedback-state";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getSleepHistory, type SleepEntry } from "@/lib/sleep";
import { formatDateLabel, formatKathmanduTime } from "@/lib/time";

export const dynamic = "force-dynamic";

function groupSleepByDate(entries: SleepEntry[]): Array<[string, SleepEntry[]]> {
  const groups = new Map<string, SleepEntry[]>();
  for (const entry of entries) {
    groups.set(entry.sleep_date, [...(groups.get(entry.sleep_date) ?? []), entry]);
  }
  return [...groups.entries()];
}

function SleepCard({ entry }: { entry: SleepEntry }) {
  return (
    <AggregateCard>
      <AggregateCardHeader
        title={`${Number(entry.hours_slept).toFixed(1)} hrs`}
        metadata={`${formatKathmanduTime(entry.sleep_start)} – ${formatKathmanduTime(entry.sleep_end)}`}
        status={
          <SleepEntryDialog
            existing={entry}
            triggerLabel="Edit"
            triggerClassName="button-secondary button-compact"
          />
        }
      />
      {entry.notes ? <p className="exercise-preview">{entry.notes}</p> : null}
      {entry.quality_rating ? (
        <MetricList items={[{ label: "Quality", value: `${entry.quality_rating}/5` }]} />
      ) : null}
    </AggregateCard>
  );
}

function EmptySleep({ isDefaultRange }: { isDefaultRange: boolean }) {
  return (
    <EmptyState
      id="no-sleep-title"
      title={isDefaultRange ? "No sleep logged today" : "No sleep in this range"}
      description={
        isDefaultRange
          ? "Log a complete sleep interval to start today’s history."
          : "Nothing was logged in the selected dates."
      }
      icon={<MoonIcon size={24} weight="regular" />}
      action={<SleepEntryDialog triggerClassName="button-primary" />}
    />
  );
}

function UnavailableSleep() {
  return (
    <FeedbackState
      id="sleep-error-title"
      title="Sleep history is unavailable"
      description="Refresh to try again."
      icon={<WarningCircleIcon size={24} weight="regular" />}
      tone="warning"
    />
  );
}

export default async function SleepPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? today;
  const isDefaultRange = !params.start && !params.end;
  const result = await getSleepHistory(startDate, endDate);

  return (
    <AppShell activeDestination="sleep">
      <PageContainer>
        <PageHeader
          title="Sleep"
          actions={
            <>
              <DateRangeFilter
                basePath="/sleep"
                startDate={startDate}
                endDate={endDate}
                isDefaultRange={isDefaultRange}
                todayDate={today}
                clearBehavior="today"
              />
              <SleepEntryDialog triggerClassName="button-primary" />
            </>
          }
        />

        {!result.ok ? (
          <UnavailableSleep />
        ) : result.data.entries.length === 0 ? (
          <EmptySleep isDefaultRange={isDefaultRange} />
        ) : (
          <div className="workout-groups collection" data-view="list">
            {groupSleepByDate(result.data.entries).map(([date, entries]) => (
              <section className="workout-day" key={date}>
                <h2>{date === today ? "Today" : formatDateLabel(date)}</h2>
                <div className="workout-list">
                  {entries.map((entry) => (
                    <SleepCard entry={entry} key={entry.id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
