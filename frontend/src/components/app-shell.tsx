import {
  BarbellIcon,
  BowlFoodIcon,
  CalendarDotsIcon,
  HouseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Show, UserButton } from "@clerk/nextjs";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export type NavigationDestination = "today" | "workouts" | "meals" | "history";

type NavigationItem = {
  destination: NavigationDestination;
  label: string;
  icon: Icon;
  href?: string;
};

const navigation: NavigationItem[] = [
  { destination: "today", label: "Today", icon: HouseIcon, href: "/" },
  {
    destination: "workouts",
    label: "Workouts",
    icon: BarbellIcon,
    href: "/workouts",
  },
  { destination: "meals", label: "Meals", icon: BowlFoodIcon, href: "/meals" },
  {
    destination: "history",
    label: "History",
    icon: CalendarDotsIcon,
    href: "/history",
  },
];

function Navigation({ activeDestination }: { activeDestination: NavigationDestination }) {
  return (
    <nav className="app-navigation" aria-label="Primary navigation">
      {navigation.map(({ destination, label, icon: NavigationIcon, href }) => {
        const active = destination === activeDestination;
        const content = (
          <>
            <NavigationIcon size={22} weight={active ? "fill" : "regular"} />
            <span>{label}</span>
          </>
        );

        if (href) {
          return (
            <Link
              className="navigation-item"
              data-active={active || undefined}
              aria-current={active ? "page" : undefined}
              href={href}
              key={destination}
            >
              {content}
            </Link>
          );
        }

        return (
          <span
            className="navigation-item"
            aria-disabled="true"
            key={destination}
          >
            {content}
          </span>
        );
      })}
    </nav>
  );
}

function AccountControls({ layout }: { layout: "header" | "sidebar" }) {
  return (
    <div className="account-controls" data-layout={layout}>
      <Show when="signed-out">
        {layout === "header" ? (
          <>
            <Link className="button-secondary button-compact" href="/sign-in">
              Sign in
            </Link>
            <Link className="button-primary button-compact" href="/sign-up">
              Sign up
            </Link>
          </>
        ) : (
          <Link className="button-secondary button-compact account-sidebar-link" href="/sign-in">
            Sign in
          </Link>
        )}
      </Show>
      <Show when="signed-in">
        <UserButton appearance={clerkAppearance} />
      </Show>
    </div>
  );
}

export function AppShell({
  activeDestination,
  children,
}: {
  activeDestination: NavigationDestination;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <BrandLogo />
        <Navigation activeDestination={activeDestination} />
        <AccountControls layout="sidebar" />
      </aside>
      <div className="app-frame">
        <header className="mobile-header">
          <BrandLogo />
          <AccountControls layout="header" />
        </header>
        {children}
      </div>
      <div className="mobile-navigation">
        <Navigation activeDestination={activeDestination} />
      </div>
    </div>
  );
}
