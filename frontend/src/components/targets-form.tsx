"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { saveTargets } from "@/lib/actions/targets";
import type { Targets } from "@/lib/targets";

const fields = [
  ["calorie_target_kcal", "Daily energy", "kcal", "1"],
  ["protein_target_g", "Daily protein", "g", "0.1"],
  ["carb_target_g", "Daily carbohydrates", "g", "0.1"],
  ["fat_target_g", "Daily fat", "g", "0.1"],
  ["goal_weight_kg", "Goal weight", "kg", "0.1"],
] as const;

function initialValue(value: string | null | undefined): string {
  return value === null || value === undefined ? "" : String(Number(value));
}

export function TargetsForm({ targets }: { targets: Targets | null }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries([
      ...fields.map(([name]) => [name, initialValue(targets?.[name])]),
      [
        "target_workout_days_per_week",
        targets?.target_workout_days_per_week?.toString() ?? "",
      ],
    ]),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setMessage(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload: Record<string, number | null> = {};
    for (const [name] of fields) {
      const value = values[name].trim();
      payload[name] = value === "" ? null : Number(value);
    }
    const workoutValue = values.target_workout_days_per_week.trim();
    payload.target_workout_days_per_week = workoutValue === "" ? null : Number(workoutValue);
    if (
      Object.entries(payload).some(
        ([name, value]) =>
          value !== null &&
          (!Number.isFinite(value) ||
            (name === "target_workout_days_per_week"
              ? value < 0 || value > 7 || !Number.isInteger(value)
              : value <= 0)),
      )
    ) {
      setMessage({ tone: "error", text: "Enter positive targets; workout days must be 0 to 7." });
      return;
    }
    setSaving(true);
    const result = await saveTargets(payload);
    setSaving(false);
    setMessage(
      result.ok
        ? { tone: "success", text: "Targets saved." }
        : { tone: "error", text: result.message },
    );
  }

  return (
    <form className="settings-form" onSubmit={submit}>
      <div className="settings-fields">
        {fields.map(([name, label, unit, step]) => (
          <div className="field" key={name}>
            <label className="field-label" htmlFor={name}>{label}</label>
            <div className="field-with-unit">
              <input
                id={name}
                className="field-input"
                type="number"
                inputMode="decimal"
                min="0"
                step={step}
                placeholder="Not set"
                value={values[name]}
                onChange={(event) => update(name, event.target.value)}
              />
              <span className="field-unit">{unit}</span>
            </div>
          </div>
        ))}
        <div className="field">
          <label className="field-label" htmlFor="target_workout_days_per_week">
            Workout days per week
          </label>
          <input
            id="target_workout_days_per_week"
            className="field-input"
            type="number"
            inputMode="numeric"
            min="0"
            max="7"
            step="1"
            placeholder="Not set"
            value={values.target_workout_days_per_week}
            onChange={(event) => update("target_workout_days_per_week", event.target.value)}
          />
        </div>
      </div>
      {message ? (
        <p className="form-banner" data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>
          {message.tone === "success" ? <CheckCircleIcon size={18} weight="fill" /> : <WarningCircleIcon size={18} weight="fill" />}
          {message.text}
        </p>
      ) : null}
      <Button variant="primary" type="submit" loading={saving}>
        Save targets
      </Button>
    </form>
  );
}
