import {
  BarbellIcon,
  BowlFoodIcon,
  CalendarDotsIcon,
  HouseIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
  { destination: "meals", label: "Meals", icon: BowlFoodIcon },
  { destination: "history", label: "History", icon: CalendarDotsIcon },
];

function BrandLogo() {
  return (
    <Link className="brand-logo" href="/" aria-label="Nirantar home">
      <Image
        src="/logo/light_logo.png"
        alt=""
        width={1374}
        height={1145}
        sizes="(min-width: 1128px) 68px, 72px"
        priority
      />
    </Link>
  );
}

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
      </aside>
      <div className="app-frame">
        <header className="mobile-header">
          <BrandLogo />
        </header>
        {children}
      </div>
      <div className="mobile-navigation">
        <Navigation activeDestination={activeDestination} />
      </div>
    </div>
  );
}
