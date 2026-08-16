"use client";

import type { DraftDropset, DraftSet } from "@/components/workout-form/types";

export function SetFields({
  values,
  onChange,
  labelPrefix,
}: {
  values: Pick<DraftSet | DraftDropset, "weight_kg" | "reps" | "rir" | "rpe">;
  onChange: (
    field: "weight_kg" | "reps" | "rir" | "rpe",
    value: string,
  ) => void;
  labelPrefix: string;
}) {
  return (
    <div className="set-fields">
      <label className="set-field">
        <span className="set-field-label">Weight</span>
        <span className="set-field-with-unit">
          <input
            className="set-field-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            aria-label={`${labelPrefix} weight in kilograms`}
            value={values.weight_kg}
            onChange={(event) => onChange("weight_kg", event.target.value)}
          />
          <span className="set-field-unit">kg</span>
        </span>
      </label>
      <label className="set-field">
        <span className="set-field-label">Reps</span>
        <input
          className="set-field-input"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          aria-label={`${labelPrefix} reps`}
          value={values.reps}
          onChange={(event) => onChange("reps", event.target.value)}
        />
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">RIR</span>
        <input
          className="set-field-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={10}
          step={0.5}
          aria-label={`${labelPrefix} reps in reserve`}
          value={values.rir}
          onChange={(event) => onChange("rir", event.target.value)}
        />
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">RPE</span>
        <input
          className="set-field-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={10}
          step={0.5}
          aria-label={`${labelPrefix} rate of perceived exertion`}
          value={values.rpe}
          onChange={(event) => onChange("rpe", event.target.value)}
        />
      </label>
    </div>
  );
}
