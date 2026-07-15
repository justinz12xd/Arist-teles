"use client";

import { useEffect, useState } from "react";
import { Menu, Scale, X } from "lucide-react";

const LINKS = [
  { href: "#about", label: "Qué hace" },
  { href: "/chat", label: "Chat" },
  { href: "#timeline", label: "Flujo" },
  { href: "/agent", label: "Consola" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-[var(--header-h)] transition-colors duration-300 ${
        scrolled ? "border-b border-[var(--primary-4)] bg-[rgb(5_5_5/0.7)] backdrop-blur-md" : ""
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <a
          href="/"
          className="flex min-h-11 min-w-0 items-center gap-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]"
        >
          <Scale size={18} className="shrink-0 text-[var(--accent-cyan)]" />
          <span className="truncate">Aristoteles</span>
        </a>
        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-[var(--primary-44)] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="/agent"
          className="hidden min-h-11 shrink-0 items-center rounded-full bg-[var(--accent-marble)] px-4 text-sm font-medium text-black transition-shadow hover:shadow-[0_0_20px_rgb(216_177_95/0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)] sm:inline-flex"
        >
          Probar agente
        </a>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--primary-12)] text-white transition-colors hover:bg-[var(--primary-4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)] lg:hidden"
          aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {menuOpen && (
        <div className="mx-4 rounded-2xl border border-[var(--primary-12)] bg-[rgb(5_5_5/0.92)] p-2 shadow-[0_20px_80px_rgb(0_0_0/0.45)] backdrop-blur-md lg:hidden">
          <nav className="grid">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--primary-80)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-cyan)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/agent"
              className="mt-1 flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent-marble)] px-3 text-sm font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-cyan)] sm:hidden"
              onClick={() => setMenuOpen(false)}
            >
              Probar agente
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
