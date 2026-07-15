import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Radio, Users, Wrench, Rocket, Trophy } from "lucide-react";

const STAGES = [
  { icon: Radio, time: "VIE 18:00", title: "Señal de apertura", desc: "Briefing de la misión, formación de tripulaciones y apertura de compuertas." },
  { icon: Users, time: "VIE 21:00", title: "Acople de equipos", desc: "Pitch relámpago de ideas. Los equipos se acoplan y reservan su módulo." },
  { icon: Wrench, time: "SÁB 10:00", title: "Construcción en gravedad cero", desc: "24 horas de build ininterrumpido con mentores rotando por cabinas." },
  { icon: Rocket, time: "DOM 15:00", title: "Ventana de lanzamiento", desc: "Congelamiento de código. Cada equipo presenta su demo en vivo, sin slides." },
  { icon: Trophy, time: "DOM 19:00", title: "Reentrada", desc: "Veredicto del jurado, premios y transmisión de cierre desde el puente." },
];

export function Timeline() {
  return (
    <section id="timeline" className="relative mx-auto max-w-6xl scroll-mt-[var(--header-h)] px-6 py-32">
      <ScrollReveal>
        <SectionLabel>[ 02 · bitácora ]</SectionLabel>
        <h2 className="text-h2 max-w-2xl">La cuenta regresiva ya empezó.</h2>
      </ScrollReveal>

      <div className="relative mt-16 ml-4 border-l border-[var(--primary-12)] pl-10">
        {STAGES.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.06} className="relative pb-14 last:pb-0">
            <span className="absolute -left-[45px] flex h-4 w-4 items-center justify-center rounded-full border border-[var(--accent-cyan)] bg-[var(--bg-void)] shadow-[0_0_12px_rgb(34_211_238/0.5)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)]" />
            </span>
            <p className="section-label">{s.time}</p>
            <div className="mt-2 flex items-center gap-3">
              <s.icon size={18} className="text-[var(--accent-cyan)]" />
              <h3 className="text-h3">{s.title}</h3>
            </div>
            <p className="mt-2 max-w-lg text-[var(--primary-60)]">{s.desc}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
