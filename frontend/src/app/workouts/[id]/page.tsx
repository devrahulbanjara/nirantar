import {
  BarbellIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { WorkoutDetailActions } from "@/components/workouts/workout-detail-actions";
import { getWorkout, type ExerciseSet, type WorkoutExercise } from "@/lib/workouts";
import { formatDurationBetween, formatKathmanduDateTime, formatKathmanduTime } from "@/lib/time";

export const dynamic = "force-dynamic";

function formatSetValue(set: { weight_kg: string | null; reps: number | null }) {
  const weight = set.weight_kg === null ? null : Number(set.weight_kg);
  const parts: string[] = [];
  parts.push(weight === null ? "— kg" : `${weight} kg`);
  parts.push(set.reps === null ? "— reps" : `${set.reps} reps`);
  return parts.join(" × ");
}

function setTypeLabel(type: string): string {
  if (type === "warmup") return "Warm-up";
  if (type === "working") return "Working";
  return "Drop";
}

function SetRow({ set, index }: { set: ExerciseSet; index: number }) {
  return (
    <li className="set-row">
      <div className="set-row-main">
        <span className="set-row-order">{index + 1}</span>
        <span className="set-row-type">{setTypeLabel(set.set_type)}</span>
        <span className="set-row-value">{formatSetValue(set)}</span>
        {set.rir !== null || set.rpe !== null ? (
          <span className="set-row-effort">
            {set.rir !== null ? `RIR ${set.rir}` : null}
            {set.rir !== null && set.rpe !== null ? " · " : null}
            {set.rpe !== null ? `RPE ${set.rpe}` : null}
          </span>
        ) : null}
      </div>
      {set.dropsets.length > 0 ? (
        <ol className="dropset-list">
          {set.dropsets
            .slice()
            .sort((a, b) => a.set_order - b.set_order)
            .map((dropset, dropIndex) => (
            <li className="dropset-row" key={dropset.id}>
              <span className="dropset-row-label">Drop {dropIndex + 1}</span>
              <span className="set-row-value">{formatSetValue(dropset)}</span>
              {dropset.rir !== null || dropset.rpe !== null ? (
                <span className="set-row-effort">
                  {dropset.rir !== null ? `RIR ${dropset.rir}` : null}
                  {dropset.rir !== null && dropset.rpe !== null ? " · " : null}
                  {dropset.rpe !== null ? `RPE ${dropset.rpe}` : null}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </li>
  );
}

function ExerciseCard({ exercise }: { exercise: WorkoutExercise }) {
  const topLevelSets = exercise.sets
    .filter((set) => set.parent_set_id === null)
    .slice()
    .sort((a, b) => a.set_order - b.set_order);

  return (
    <article className="workout-exercise-card">
      <header className="workout-exercise-heading">
        <span className="exercise-builder-order" aria-hidden="true">
          {exercise.exercise_order}
        </span>
        <h3>{exercise.exercise_name}</h3>
      </header>
      {exercise.notes ? <p className="card-note">{exercise.notes}</p> : null}
      {topLevelSets.length > 0 ? (
        <ol className="set-list">
          {topLevelSets.map((set, index) => (
            <SetRow set={set} index={index} key={set.id} />
          ))}
        </ol>
      ) : (
        <p className="field-hint">No sets recorded.</p>
      )}
    </article>
  );
}

function UnavailableWorkout() {
  return (
    <section className="workouts-state" aria-labelledby="workout-error-title">
      <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="workout-error-title">This workout is unavailable</h2>
        <p>Refresh to try again.</p>
      </div>
    </section>
  );
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkout(id);

  if (result.status === "not-found") notFound();

  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        {result.status === "unavailable" ? (
          <UnavailableWorkout />
        ) : (
          <>
            <header className="detail-heading">
              <div>
                <p className="local-date">
                  {formatKathmanduDateTime(result.workout.check_in_at)}
                  {result.workout.check_out_at
                    ? ` – ${formatKathmanduTime(result.workout.check_out_at)}`
                    : ""}
                </p>
                <h1>{result.workout.title ?? "Workout"}</h1>
                <span
                  className="workout-status"
                  data-status={result.workout.check_out_at ? "completed" : "open"}
                >
                  {result.workout.check_out_at ? (
                    <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />
                  ) : (
                    <ClockIcon size={15} weight="fill" aria-hidden="true" />
                  )}
                  {result.workout.check_out_at ? "Completed" : "Open"}
                </span>
              </div>
              <WorkoutDetailActions
                workoutId={result.workout.id}
                title={result.workout.title ?? "Workout"}
                updatedAt={result.workout.updated_at}
              />
            </header>

            {result.workout.notes ? (
              <p className="card-note detail-notes">{result.workout.notes}</p>
            ) : null}

            <dl className="workout-list-metrics detail-metrics">
              <div>
                <dt>Duration</dt>
                <dd>
                  {formatDurationBetween(
                    result.workout.check_in_at,
                    result.workout.check_out_at,
                  )}
                </dd>
              </div>
              <div>
                <dt>Exercises</dt>
                <dd>{result.workout.exercises.length}</dd>
              </div>
              <div>
                <dt>Working sets</dt>
                <dd>{result.workout.working_set_count}</dd>
              </div>
              <div>
                <dt>Drop sets</dt>
                <dd>{result.workout.dropset_count}</dd>
              </div>
            </dl>

            {result.workout.exercises.length === 0 ? (
              <section className="workouts-state" aria-labelledby="no-exercises-title">
                <BarbellIcon size={24} weight="regular" aria-hidden="true" />
                <div>
                  <h2 id="no-exercises-title">No exercises recorded</h2>
                </div>
              </section>
            ) : (
              <div className="workout-exercise-list">
                {result.workout.exercises
                  .slice()
                  .sort((a, b) => a.exercise_order - b.exercise_order)
                  .map((exercise) => (
                    <ExerciseCard exercise={exercise} key={exercise.id} />
                  ))}
              </div>
            )}

            {result.workout.groups.length > 0 ? (
              <section className="daily-section" aria-labelledby="supersets-title">
                <div className="section-heading">
                  <h2 id="supersets-title">Supersets</h2>
                </div>
                <ul className="groups-editor-list">
                  {result.workout.groups
                    .slice()
                    .sort((a, b) => a.group_order - b.group_order)
                    .map((group, index) => (
                      <li className="groups-editor-chip" key={group.id}>
                        <span>
                          <strong>Superset {index + 1}:</strong>{" "}
                          {group.members
                            .slice()
                            .sort((a, b) => a.member_order - b.member_order)
                            .map((member) => member.exercise_name)
                            .join(" + ")}
                        </span>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </AppShell>
  );
}
