"use client";

import type { InputHTMLAttributes } from "react";

import type { DraftDropset, DraftSet } from "@/components/workout-form/types";

type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode" | "min" | "step" | "aria-label"
>;

export function SetFields({
  values,
  onChange,
  labelPrefix,
  weightInputProps,
  repsInputProps,
}: {
  values: Pick<DraftSet | DraftDropset, "weight_kg" | "reps">;
  onChange: (field: "weight_kg" | "reps", value: string) => void;
  labelPrefix: string;
  weightInputProps?: NumericInputProps;
  repsInputProps?: NumericInputProps;
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
            {...weightInputProps}
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
          {...repsInputProps}
        />
      </label>
    </div>
  );
}
