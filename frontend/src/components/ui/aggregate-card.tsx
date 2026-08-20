import Link from "next/link";
import type { ReactNode } from "react";

export function AggregateCard({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className="aggregate-card">
        {children}
      </Link>
    );
  }

  return <article className="aggregate-card">{children}</article>;
}

export function AggregateCardHeader({
  title,
  metadata,
  status,
}: {
  title: ReactNode;
  metadata?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header className="aggregate-card-header">
      <div>
        <h3>{title}</h3>
        {metadata ? <p>{metadata}</p> : null}
      </div>
      {status}
    </header>
  );
}

export function MetricList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="metric-list" data-count={items.length}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
