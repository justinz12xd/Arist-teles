import { BrainCircuit } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--primary-4)] px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex items-center gap-2 text-white">
          <BrainCircuit size={18} className="text-[var(--accent-cyan)]" />
          <span className="font-medium">Aristoteles</span>
          <span className="section-label ml-3">decision respaldada por evidencia</span>
        </div>

        <nav className="flex gap-6 text-sm text-[var(--primary-44)]">
          <a href="#about" className="transition-colors hover:text-white">
            Sistema
          </a>
          <a href="#timeline" className="transition-colors hover:text-white">
            Flujo
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQ
          </a>
        </nav>

        <div className="flex gap-5 font-mono text-xs tracking-widest text-[var(--primary-44)]">
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">
            GITHUB
          </a>
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">
            DEMO
          </a>
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">
            PDF
          </a>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-[var(--primary-44)]">
        (C) 2026 Aristoteles. Sistema de apoyo a decisiones, no sustituto de criterio profesional.
      </p>
    </footer>
  );
}
