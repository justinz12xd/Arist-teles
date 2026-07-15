import type { ReactNode } from "react";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
  ariaLabel?: string;
};

export function Button({ href, variant = "primary", children, ariaLabel }: Props) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-center text-sm font-medium transition-[transform,box-shadow,background-color,color,border-color] duration-200 motion-safe:hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent-marble)] text-black hover:shadow-[0_0_24px_rgb(216_177_95/0.35)]"
      : "border border-[var(--primary-12)] text-white hover:bg-[var(--primary-4)]";
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`${base} ${styles}`}
      style={{ transitionTimingFunction: "var(--ease-soft)" }}
    >
      {children}
    </a>
  );
}
