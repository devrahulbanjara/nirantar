import { GaugeIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import {
  CollectionActions,
  CollectionEmptyBody,
  resolveCollectionStatus,
  type CreateAction,
} from "@/components/ui/collection";
import { TrendChart } from "@/components/ui/data-viz";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { ViewToggle, type CollectionView } from "@/components/ui/view-toggle";
import { WeightEntryDialog } from "@/components/weight-entry-dialog";
import { getKathmanduDate } from "@/lib/daily-summary";
import { formatNumeric } from "@/lib/nutrition";
import { getWeightHistory, type WeightEntry } from "@/lib/weights";
import { addDaysToDateString, formatDateShortLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE_DAYS = 90;

function changeFromPrevious(currentKg: string, previousKg: string | undefined) {
  if (previousKg === undefined) return null;
  const delta = Number(currentKg) - Number(previousKg);
  if (!Number.isFinite(delta) || delta === 0) return null;
  const amount = formatNumeric(delta, 3);
  if (!amount) return null;
  return `${delta > 0 ? "+" : ""}${amount} kg`;
}

function WeightRecord({
  entry,
  previousKg,
}: {
  entry: WeightEntry;
  previousKg?: string;
}) {
  const change = changeFromPrevious(entry.weight_kg, previousKg);

  return (
    <li className="weight-entry-row">
      <div className="weight-entry-copy">
        <p className="weight-entry-date">{formatDateShortLabel(entry.measured_on)}</p>
        {change ? (
          <p className="weight-entry-change">
            <span className="visually-hidden">Change from previous measurement </span>
            {change}
          </p>
        ) : null}
        {entry.notes ? <p className="field-hint">{entry.notes}</p> : null}
      </div>
      <div className="weight-entry-actions">
        <p className="metric-value">
          <span>{formatNumeric(entry.weight_kg, 3)}</span>
          <abbr>kg</abbr>
        </p>
        <WeightEntryDialog
          existing={entry}
          triggerLabel="Edit"
          triggerVariant="tertiary"
          triggerSize="sm"
        />
      </div>
    </li>
  );
}

export default async function WeightPage({
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
  const history =
    weightResult.status === "ready" ? weightResult.history : undefined;
  const entries = history?.entries ?? [];
  const todayWeightEntry = entries.find((entry) => entry.measured_on === today);

  const status = resolveCollectionStatus({
    unavailable: weightResult.status === "unavailable",
    count: entries.length,
    isFiltered: !isDefaultRange,
  });

  const createWeight: CreateAction = {
    label: "Log weight",
    icon: PlusIcon,
    render: ({ size }) => (
      <WeightEntryDialog
        triggerLabel="Log weight"
        triggerVariant="primary"
        triggerSize={size}
        defaultDate={today}
        existing={todayWeightEntry}
      />
    ),
  };

  return (
    <AppShell activeDestination="weight">
      <PageContainer>
        <PageHeader
          title="Weight"
          actions={
            <CollectionActions
              status={status}
              filter={
                <DateRangeFilter
                  basePath="/weight"
                  startDate={startDate}
                  endDate={endDate}
                  isDefaultRange={isDefaultRange}
                  todayDate={today}
                  clearBehavior="omit-params"
                  extraParams={{ view }}
                />
              }
              viewToggle={
                <ViewToggle
                  basePath="/weight"
                  view={view}
                  params={historyParams}
                  preferenceKey="nirantar:view:weight"
                />
              }
              createAction={createWeight}
            />
          }
        />

        {status !== "ready" ? (
          <CollectionEmptyBody
            status={status}
            id="no-weight-title"
            icon={<GaugeIcon size={24} weight="regular" />}
            createAction={createWeight}
            emptyTitle="No body weight logged"
            emptyDescription="Log today’s weight to start your measurement history."
            noResultsTitle="No body weight in this range"
            noResultsDescription="Nothing was logged in the selected dates."
            clearFilterAction={
              <Button href="/weight" variant="secondary" size="lg">
                Clear dates
              </Button>
            }
            unavailableTitle="Body weight history is unavailable"
          />
        ) : (
          <section className="daily-section" aria-label="Weight measurements">
            {entries.length > 1 ? (
              <TrendChart
                label="Current weight"
                unit="kg"
                points={entries
                  .slice()
                  .sort((a, b) => (a.measured_on < b.measured_on ? -1 : 1))
                  .map((entry) => ({
                    date: entry.measured_on,
                    value: Number(entry.weight_kg),
                  }))}
              />
            ) : null}
            <dl className="workout-list-metrics detail-metrics">
              <div>
                <dt>Measurements</dt>
                <dd>{history?.measurement_count}</dd>
              </div>
              <div>
                <dt>First</dt>
                <dd>
                  {history?.first_weight_kg
                    ? `${formatNumeric(history.first_weight_kg, 3)} kg`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Last</dt>
                <dd>
                  {history?.last_weight_kg
                    ? `${formatNumeric(history.last_weight_kg, 3)} kg`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Change</dt>
                <dd>
                  {history?.change_kg
                    ? `${Number(history.change_kg) > 0 ? "+" : ""}${formatNumeric(history.change_kg, 3)} kg`
                    : "—"}
                </dd>
              </div>
            </dl>

            <ul className="weight-entry-list" data-view={view}>
              {entries
                .slice()
                .sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1))
                .map((entry, index, ordered) => (
                  <WeightRecord
                    entry={entry}
                    previousKg={ordered[index + 1]?.weight_kg}
                    key={entry.id}
                  />
                ))}
            </ul>
          </section>
        )}
      </PageContainer>
    </AppShell>
  );
}
