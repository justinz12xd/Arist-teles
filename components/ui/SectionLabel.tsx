export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="section-label mb-4">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)] align-middle" />
      {children}
    </p>
  );
}
