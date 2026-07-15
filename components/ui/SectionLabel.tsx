import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="section-label mb-4">
      <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)] align-middle" />
      {children}
    </p>
  );
}
