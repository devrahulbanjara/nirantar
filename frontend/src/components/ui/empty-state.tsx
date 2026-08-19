import type { ReactNode } from "react";

export function EmptyState({
  id,
  title,
  description,
  icon,
  action,
  variant = "page",
}: {
  id: string;
  title: string;
  description?: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
  variant?: "page" | "nested";
}) {
  return (
    <section
      className="empty-state"
      data-variant={variant}
      aria-labelledby={id}
    >
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="empty-state-copy">
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </section>
  );
}
