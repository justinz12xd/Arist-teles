"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";

const LINKS = [
  { href: "#about", label: "Que hace" },
  { href: "/chat", label: "Chat" },
  { href: "#timeline", label: "Flujo" },
  { href: "#tracks", label: "Agentes" },
  { href: "/agent", label: "Consola" },
  { href: "#speakers", label: "Controles" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
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
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 font-medium text-white">
          <Scale size={18} className="text-[var(--accent-cyan)]" />
          Aristoteles
        </a>
        <nav className="hidden gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--primary-44)] transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="/agent"
          className="rounded-full bg-[var(--accent-marble)] px-4 py-1.5 text-sm font-medium text-black transition-shadow hover:shadow-[0_0_20px_rgb(216_177_95/0.3)]"
        >
          Probar agente
        </a>
      </div>
    </header>
  );
}
