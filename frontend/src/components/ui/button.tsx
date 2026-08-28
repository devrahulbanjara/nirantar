import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The single definition of every action control in Nirantar.
 *
 * Emphasis is a property of what the action does, never of the page it sits on.
 * See frontend/DESIGN.md -> Action hierarchy. Callers choose a `variant` and a
 * `size` from closed unions; they never pass a class name or inline style.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
/** `danger` is for delete/remove/discard. Rest stays quiet; hover uses the danger tokens. */
export type ButtonTone = "danger";

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

type SharedProps = {
  children: ReactNode;
  /** Defaults to `secondary` so an unconsidered action never claims primary emphasis. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorative leading icon. The label must still read correctly without it. */
  icon?: Icon;
  fullWidth?: boolean;
  /**
   * `danger` marks a delete, remove, or discard action. The rest appearance
   * still follows `variant`; hover turns reddish everywhere this is set.
   * Confirming a deletion inside a dialog uses `variant="destructive"` instead.
   */
  tone?: ButtonTone;
};

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children"> & {
    href?: undefined;
    /** Blocks duplicate submission and preserves the control's width. */
    loading?: boolean;
  };

type ButtonAsLink = SharedProps & {
  href: string;
  loading?: undefined;
  disabled?: undefined;
  "aria-label"?: string;
  "aria-current"?: "page" | "true" | undefined;
  prefetch?: boolean;
  target?: string;
  rel?: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function Content({
  icon: IconComponent,
  size,
  children,
}: {
  icon?: Icon;
  size: ButtonSize;
  children: ReactNode;
}) {
  return (
    <>
      {IconComponent ? (
        <IconComponent size={ICON_SIZE[size]} weight="bold" aria-hidden="true" />
      ) : null}
      <span className="button-label">{children}</span>
    </>
  );
}

/** Props owned by this component; everything else reaches the DOM element. */
const OWN_PROP_KEYS = new Set([
  "variant",
  "size",
  "icon",
  "fullWidth",
  "tone",
  "href",
  "loading",
  "children",
  "type",
]);

function toDomProps(props: ButtonAsButton) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !OWN_PROP_KEYS.has(key)),
  ) as ButtonHTMLAttributes<HTMLButtonElement>;
}

export function Button(props: ButtonProps) {
  const { variant = "secondary", size = "md", icon, fullWidth, tone, children } = props;

  const dataProps = {
    "data-variant": variant,
    "data-size": size,
    "data-full-width": fullWidth ? "true" : undefined,
    "data-tone": tone,
  };

  if (props.href !== undefined) {
    const { href, prefetch, target, rel } = props;
    return (
      <Link
        className="button"
        href={href}
        prefetch={prefetch}
        target={target}
        rel={rel}
        aria-label={props["aria-label"]}
        aria-current={props["aria-current"]}
        {...dataProps}
      >
        <Content icon={icon} size={size}>
          {children}
        </Content>
      </Link>
    );
  }

  const { loading = false, disabled, type = "button" } = props;

  return (
    <button
      className="button"
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      {...dataProps}
      {...toDomProps(props)}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      <Content icon={loading ? undefined : icon} size={size}>
        {children}
      </Content>
    </button>
  );
}

/**
 * An icon-only action. The accessible name is required, and the hit area is
 * always at least the shared touch target regardless of the visual size.
 */
export function IconButton({
  icon: IconComponent,
  label,
  variant = "tertiary",
  size = "md",
  tone,
  href,
  ...rest
}: {
  icon: Icon;
  label: string;
  variant?: Exclude<ButtonVariant, "primary">;
  size?: ButtonSize;
  tone?: ButtonTone;
  href?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "style" | "children" | "aria-label"
>) {
  const content = (
    <IconComponent size={ICON_SIZE[size]} weight="regular" aria-hidden="true" />
  );

  if (href !== undefined) {
    return (
      <Link
        className="icon-button"
        href={href}
        aria-label={label}
        data-variant={variant}
        data-size={size}
        data-tone={tone}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className="icon-button"
      type="button"
      aria-label={label}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      {...rest}
    >
      {content}
    </button>
  );
}

/** Inline text action inside prose or a compact row. Never a page CTA. */
export function TextLink({
  href,
  children,
  ...rest
}: {
  href?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children">) {
  if (href !== undefined) {
    return (
      <Link className="text-link" href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className="text-link" type="button" {...rest}>
      {children}
    </button>
  );
}
