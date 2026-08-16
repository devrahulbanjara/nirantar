import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function BrandLogo({
  href = "/",
  sizes = "(min-width: 1128px) 68px, 72px",
}: {
  href?: string;
  sizes?: string;
}) {
  return (
    <Link className="brand-logo" href={href} aria-label="Nirantar home">
      <Image
        src="/logo/light_logo.png"
        alt=""
        width={1374}
        height={1145}
        sizes={sizes}
        priority
      />
    </Link>
  );
}

export function AuthShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <header className="auth-brand">
        <BrandLogo sizes="72px" />
      </header>
      <div className="auth-panel">
        {children}
      </div>
    </main>
  );
}
