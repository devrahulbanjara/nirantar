import type { ReactNode } from "react";

export function FeedbackState({
  id,
  title,
  description,
  icon,
  action,
  tone = "neutral",
}: {
  id: string;
  title: string;
  description?: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <section className="feedback-state" data-tone={tone} aria-labelledby={id}>
      <span className="feedback-state-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="feedback-state-copy">
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="feedback-state-action">{action}</div> : null}
      </div>
    </section>
  );
}
