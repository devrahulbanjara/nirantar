import type { ReactNode } from "react";

export function PageContainer({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "default" | "reading";
}) {
  return (
    <main className="page-container" data-width={width}>
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  eyebrow,
  actions,
}: {
  title: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow ? <p className="page-header-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  id,
  title,
  description,
  action,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-header-action">{action}</div> : null}
    </div>
  );
}
