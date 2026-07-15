import type { ReactNode } from "react";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
};

export function Button({ href, variant = "primary", children }: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:shadow-[0_0_24px_rgb(34_211_238/0.35)]"
      : "border border-[var(--primary-12)] text-white hover:bg-[var(--primary-4)]";
  return (
    <a href={href} className={`${base} ${styles}`} style={{ transitionTimingFunction: "var(--ease-soft)" }}>
      {children}
    </a>
  );
}
