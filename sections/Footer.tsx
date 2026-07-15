import { Orbit } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--primary-4)] px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex items-center gap-2 text-white">
          <Orbit size={18} className="text-[var(--accent-cyan)]" />
          <span className="font-medium">ORBITAL</span>
          <span className="section-label ml-3">fin de la transmisión</span>
        </div>

        <nav className="flex gap-6 text-sm text-[var(--primary-44)]">
          <a href="#about" className="transition-colors hover:text-white">Misión</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          <a href="#" className="transition-colors hover:text-white">Código de conducta</a>
        </nav>

        <div className="flex gap-5 font-mono text-xs tracking-widest text-[var(--primary-44)]">
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">GITHUB</a>
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">X</a>
          <a href="#" className="transition-colors hover:text-[var(--accent-cyan)]">LINKEDIN</a>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-[var(--primary-44)]">
        © 2026 Estación Órbita. Construido en gravedad cero.
      </p>
    </footer>
  );
}
