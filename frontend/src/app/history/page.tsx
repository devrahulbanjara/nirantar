import {
  BarbellIcon,
  GaugeIcon,
  MagnifyingGlassIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { WeightEntryDialog } from "@/components/weight-entry-dialog";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getExerciseHistory, type ExerciseHistoryEntry, type ExerciseHistorySet } from "@/lib/workouts";
import { getWeightHistory } from "@/lib/weights";
import { addDaysToDateString, formatDateShortLabel, formatKathmanduDateTime, KATHMANDU_OFFSET } from "@/lib/time";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE_DAYS = 90;

function formatSetValue(set: { weight_kg: string | null; reps: number | null }) {
  const weight = set.weight_kg === null ? null : Number(set.weight_kg);
  return `${weight === null ? "—" : `${weight} kg`} × ${set.reps === null ? "—" : `${set.reps} reps`}`;
}

function setTypeLabel(type: string): string {
  if (type === "warmup") return "Warm-up";
  if (type === "working") return "Working";
  return "Drop";
}

function ExerciseHistorySets({ sets }: { sets: ExerciseHistorySet[] }) {
  return (
    <ol className="set-list">
      {sets
        .slice()
        .sort((a, b) => a.set_order - b.set_order)
        .map((set, index) => (
          <li className="set-row" key={set.id}>
            <div className="set-row-main">
              <span className="set-row-order">{index + 1}</span>
              <span className="set-row-type">{setTypeLabel(set.set_type)}</span>
              <span className="set-row-value">{formatSetValue(set)}</span>
            </div>
            {set.dropsets.length > 0 ? (
              <ol className="dropset-list">
                {set.dropsets.map((dropset, dropIndex) => (
                  <li className="dropset-row" key={dropset.id}>
                    <span className="dropset-row-label">Drop {dropIndex + 1}</span>
                    <span className="set-row-value">{formatSetValue(dropset)}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
    </ol>
  );
}

function ExerciseHistorySession({ entry }: { entry: ExerciseHistoryEntry }) {
  return (
    <article className="workout-exercise-card">
      <header className="workout-exercise-heading">
        <div>
          <p className="local-date">{formatKathmanduDateTime(entry.check_in_at)}</p>
          <h3>
            <Link href={`/workouts/${entry.workout_session_id}`} className="text-link">
              {entry.workout_title ?? "Workout"}
            </Link>
          </h3>
        </div>
      </header>
      <ExerciseHistorySets sets={entry.sets} />
    </article>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; exercise?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? addDaysToDateString(endDate, -DEFAULT_RANGE_DAYS);
  const isDefaultRange = !params.start && !params.end;
  const exerciseName = params.exercise?.trim() ?? "";

  const weightResult = await getWeightHistory(startDate, endDate);
  const todayWeightEntry =
    weightResult.status === "ready"
      ? weightResult.history.entries.find((entry) => entry.measured_on === today)
      : undefined;
  const exerciseResult = exerciseName
    ? await getExerciseHistory({
        exerciseName,
        startAt: `${startDate}T00:00:00${KATHMANDU_OFFSET}`,
        endAt: `${endDate}T23:59:59${KATHMANDU_OFFSET}`,
        limit: 20,
      })
    : null;

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
            extraParams={exerciseName ? { exercise: exerciseName } : undefined}
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

        <section className="daily-section" aria-labelledby="exercise-history-title">
          <div className="section-heading">
            <h2 id="exercise-history-title">Exercise history</h2>
          </div>

          <form action="/history" method="get" className="exercise-search-form">
            <input type="hidden" name="start" value={startDate} />
            <input type="hidden" name="end" value={endDate} />
            <label className="field visually-hidden" htmlFor="exercise-search">
              Exercise name
            </label>
            <input
              id="exercise-search"
              className="field-input"
              type="text"
              name="exercise"
              placeholder="Search an exercise, e.g. Bicep Curl"
              defaultValue={exerciseName}
            />
            <button type="submit" className="button-secondary">
              <MagnifyingGlassIcon size={18} weight="bold" aria-hidden="true" />
              Search
            </button>
          </form>

          {!exerciseName ? (
            <p className="field-hint">
              Search an exercise name to see its sets across past sessions.
            </p>
          ) : exerciseResult?.status === "unavailable" ? (
            <section className="workouts-state" aria-labelledby="exercise-error-title">
              <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
              <div>
                <h2 id="exercise-error-title">Exercise history is unavailable</h2>
                <p>Refresh to try again.</p>
              </div>
            </section>
          ) : exerciseResult && exerciseResult.entries.length === 0 ? (
            <section className="workouts-state" aria-labelledby="no-exercise-history-title">
              <BarbellIcon size={24} weight="regular" aria-hidden="true" />
              <div>
                <h2 id="no-exercise-history-title">No history for “{exerciseName}”</h2>
                <p>Try a different name or widen the date range.</p>
              </div>
            </section>
          ) : exerciseResult ? (
            <div className="workout-exercise-list">
              {exerciseResult.entries.map((entry) => (
                <ExerciseHistorySession
                  entry={entry}
                  key={`${entry.workout_session_id}-${entry.workout_exercise_id}`}
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}
