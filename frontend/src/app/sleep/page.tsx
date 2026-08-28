import { MoonIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { SleepEntryDialog } from "@/components/sleep-entry-dialog";
import { AggregateCard } from "@/components/ui/aggregate-card";
import { Button } from "@/components/ui/button";
import {
  CollectionActions,
  CollectionEmptyBody,
  resolveCollectionStatus,
  type CreateAction,
} from "@/components/ui/collection";
import { StatusBadge } from "@/components/ui/data-viz";
import { DomainIcon } from "@/components/ui/metric-tile";
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
      <header className="aggregate-card-header">
        <div className="aggregate-card-lead">
          <DomainIcon tone="sleep" icon={MoonIcon} />
          <div>
            <p className="metric-hero">
              {Number(entry.hours_slept).toFixed(1)}
              <abbr>hrs</abbr>
            </p>
            <p>
              {formatKathmanduTime(entry.sleep_start)} – {formatKathmanduTime(entry.sleep_end)}
            </p>
          </div>
        </div>
        <SleepEntryDialog
          existing={entry}
          triggerLabel="Edit"
          triggerVariant="tertiary"
          triggerSize="sm"
        />
      </header>
      {entry.quality_rating ? (
        <StatusBadge tone="neutral">Quality {entry.quality_rating}/5</StatusBadge>
      ) : null}
      {entry.notes ? <p className="exercise-preview">{entry.notes}</p> : null}
    </AggregateCard>
  );
}

const CREATE_SLEEP: CreateAction = {
  label: "Log sleep",
  icon: PlusIcon,
  render: ({ size }) => (
    <SleepEntryDialog triggerVariant="primary" triggerSize={size} />
  ),
};

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
  const entries = result.ok ? result.data.entries : [];

  const status = resolveCollectionStatus({
    unavailable: !result.ok,
    count: entries.length,
    isFiltered: !isDefaultRange,
  });

  return (
    <AppShell activeDestination="sleep">
      <PageContainer>
        <PageHeader
          title="Sleep"
          actions={
            <CollectionActions
              status={status}
              filter={
                <DateRangeFilter
                  basePath="/sleep"
                  startDate={startDate}
                  endDate={endDate}
                  isDefaultRange={isDefaultRange}
                  todayDate={today}
                  clearBehavior="today"
                />
              }
              createAction={CREATE_SLEEP}
            />
          }
        />

        {status !== "ready" ? (
          <CollectionEmptyBody
            status={status}
            id="no-sleep-title"
            icon={<MoonIcon size={24} weight="regular" />}
            createAction={CREATE_SLEEP}
            emptyTitle="No sleep logged today"
            emptyDescription="Log a complete sleep interval to start today’s history."
            noResultsTitle="No sleep in this range"
            noResultsDescription="Nothing was logged in the selected dates."
            clearFilterAction={
              <Button href="/sleep" variant="secondary" size="lg">
                Back to today
              </Button>
            }
            unavailableTitle="Sleep history is unavailable"
          />
        ) : (
          <div className="workout-groups collection" data-view="list">
            {groupSleepByDate(entries).map(([date, entries]) => (
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
