# DESIGN.md — Landing "Estación Espacial" (esencia OpenAI Build Week)

> Sistema de diseño extraído por ingeniería inversa del CSS real de openai.com/build-week
> (via Wayback Machine, snapshot 2026-07-10) y adaptado a temática espacial propia.
> **Cero contenido copiado**: solo patrones, tokens y recetas de movimiento.

---

## 1. Cómo está hecha la original (hallazgos del scraping)

**Stack detectado:** Next.js (App Router, CSS chunks con `data-precedence="next"`), Tailwind + CSS Modules por componente, container queries (`@container`), `color-scheme: dark`.

**Los 4 pilares de su estética:**

1. **Negro absoluto como lienzo.** El fondo base es `#000` puro. Las secciones NO cambian de fondo: la profundidad se logra con gradientes larguísimos y sutiles hacia azul petróleo (`#000 → #06131a → #0b2433`). Una sola escena continua.

2. **Estética CRT/terminal retro-futurista.** Este es el diferencial que nadie nota a primera vista: paneles que simulan monitores de fósforo con verde `#0acd51`/`#5dd135`, typewriter con `steps()`, cursor que parpadea, glitch cada 20s, scanlines con `mix-blend-mode: overlay`, micro-blur de `.28px` en el contenido para simular tubo. Labels en monospace, uppercase, 10px, tracking `.04em`.

3. **Tipografía fluida con clamp().** Todo el type scale escala con viewport, sin breakpoints duros. Headings weight 500 (¡no bold!), tracking negativo `-.03em`, `text-wrap: balance`.

4. **Color por escalera de alfas, no por paleta.** Un solo color primario (blanco en dark) con opacidades nombradas: 2%, 4%, 12%, 44%, 60%, 80%, 100%. Los bordes glass usan el truco `padding-box/border-box` con gradiente vertical que se desvanece.

---

## 2. Tokens

### 2.1 Color

```css
:root {
  color-scheme: dark;

  /* Lienzo — una sola escena continua */
  --bg-void: #050505;              /* base (brief propio; original usa #000) */
  --bg-nebula-1: #06131a;          /* azul petróleo profundo (extraído) */
  --bg-nebula-2: #0b2433;          /* azul espacial (extraído) */
  --bg-scene: linear-gradient(180deg, var(--bg-void) 0%, var(--bg-void) 12%,
              var(--bg-nebula-1) 42%, var(--bg-nebula-2) 100%);

  /* Escalera de alfas — el sistema nervioso de todo el sitio */
  --primary-2:  rgb(255 255 255 / .08);   /* fondos hover sutiles */
  --primary-4:  rgb(255 255 255 / .12);   /* fondos de tarjeta */
  --primary-12: rgb(255 255 255 / .20);   /* bordes */
  --primary-44: rgb(255 255 255 / .44);   /* texto deshabilitado / nav inactiva */
  --primary-60: rgb(255 255 255 / .60);   /* texto secundario */
  --primary-80: rgb(255 255 255 / .80);   /* texto cuerpo */
  --primary-100: #fff;                    /* headings, CTA */

  /* Acentos propios (tema espacial del brief) */
  --accent-cyan: #22d3ee;
  --accent-blue: #3b82f6;
  --accent-violet: #8b5cf6;

  /* Acento terminal (patrón CRT extraído — original usa verde fósforo) */
  --crt-accent: #22d3ee;           /* nosotros: cyan fósforo en vez de verde */
  --crt-glow: 0 0 .2em rgb(34 211 238 / .5);

  /* Glass border (técnica extraída: doble background clip) */
  --glass-bg: rgb(11 34 48 / .72);                 /* #0b2230b8 original */
  --glass-border-top: rgb(133 191 216 / .36);      /* #85bfd85c original */
  --glass-border-bottom: rgb(133 191 216 / .18);   /* #85bfd82e original */
}
```

**Regla de oro:** ningún gris hardcodeado. Todo texto/borde/fondo sale de la escalera de alfas.

### 2.2 Tipografía

Original: **OpenAI Sans v4** (400/500/600) + mono. Nosotros: **Inter** (o Geist) + **Geist Mono**.

```css
:root {
  /* Type scale fluido — fórmula extraída: clamp entre 375px y 1440px de viewport */
  --type-h1-size: clamp(2rem, calc(2rem + 2 * ((100vw - 23.4375rem) / 66.5625)), 4rem);
  --type-h1-line: clamp(2.28rem, calc(2.28rem + 1.72 * ((100vw - 23.4375rem) / 66.5625)), 4rem);
  --type-h1-track: -.03em;
  --type-h1-weight: 500;            /* medium, NUNCA bold — clave del look premium */

  --type-h2-size: clamp(2rem, calc(2rem + 1 * ((100vw - 23.4375rem) / 66.5625)), 3rem);
  --type-h2-track: clamp(-.03em, calc(-.03em + .02 * ((90rem - 100vw) / 66.5625)), -.01em);

  /* Micro-labels terminal (patrón CRT extraído) */
  --type-label: .625rem;            /* 10px mono uppercase */
  --type-label-track: .04375em;
}
```

- Headings: weight **500**, tracking **-.03em**, `text-wrap: balance`.
- Body: `--primary-80`, line-height generoso (~1.6).
- Labels de sección/badges: mono, uppercase, 10px, tracking ancho, color `--crt-accent`. Este contraste "heading gigante serifado-limpio + microlabel de terminal" ES la identidad.
- `-webkit-font-smoothing: antialiased` en body.

### 2.3 Radios (escala extraída)

```
xs .125rem | sm .25rem | md .38rem | lg 1rem | xl 2rem | full 9999px
```

Botones: `full` (pill). Cards: `lg`/`xl`. Paneles CRT: `0` (esquinas duras = terminal).

### 2.4 Layout

- Header fijo: `--header-h: 4rem`, fondo blur al scrollear.
- Contenido: `max-width` ~62.5rem (1000px) para headings (`max-w-250` en su escala de 4px), páginas full-bleed para escenas 3D.
- Secciones con `scroll-margin-top: var(--header-h)` para anchor nav.
- Container queries (`@container`) por sección, no solo media queries.

---

## 3. Recetas de movimiento (extraídas del CSS real)

### 3.1 Easings — usar SIEMPRE estas curvas

```css
--ease-out-expo: cubic-bezier(.16, 1, .3, 1);     /* entradas — la más usada */
--ease-out-quint: cubic-bezier(.22, 1, .36, 1);   /* hero, reveals grandes */
--ease-soft: cubic-bezier(.17, .17, .3, 1);       /* hovers, micro */
--ease-standard: cubic-bezier(.4, 0, .2, 1);      /* utilitario */
```

Nada de `ease-in-out` genérico. Todo entra rápido y frena suave (out-expo).

### 3.2 Hero intro (patrón "AnimatedIntroHero" extraído)

Tres animaciones encadenadas:

1. **word-reveal** — cada palabra del H1 por separado: `opacity 0→1` casi instantánea (0.01%) + `translateY(6px→0)` durante el resto. Stagger ~80ms por palabra.
2. **color-flash** — la palabra entra con un color de acento (cyan) y decae a `inherit` (blanco). Sutil, un destello.
3. **fade-rise** — los bloques (subtítulo, botones) suben con `translateY(var(--block-y))` + fade, delay escalonado.

En Framer Motion: `staggerChildren: 0.08`, `y: 6`, `ease: [0.22, 1, 0.36, 1]`, duración 0.9s.

### 3.3 Panel CRT (patrón firma — adaptado a cyan)

```
- Overlay scanlines: pseudo-elementos ::before/::after con mix-blend-mode: overlay
- Flicker: animation .24s steps(2, end) infinite (opacidad microvariante)
- Pulse: 3s ease-in-out infinite (brillo respirando)
- Glitch: ciclo de 20s, steps(1), text-shadow desplazado 1px + blur .8px, 2-3 frames
- Typewriter: steps(28, end), duración 1.2s, cursor blink .5s step-end infinite
- Contenido con filter: blur(.28px) — el "tubo" que suaviza todo
- Bordes internos: 1px sólido acento + blur(.8px) + box-shadow glow
- Text-shadow aberración cromática: 1px 1px magenta/25%, -1px -1px cyan/20%
```

### 3.4 Objetos flotantes (patrón "Float" extraído)

Dos keyframes compuestos en elementos anidados: `float-x` (deriva horizontal) en el wrapper + `float-y-rotate` (vertical + rotación leve) en el hijo. Duraciones desfasadas (7s/9s) → movimiento orgánico tipo deriva orbital, nunca loop evidente.

### 3.5 Fades de escena (transición entre secciones)

Nunca cortes duros. Máscaras extraídas:

```css
/* pie de sección que se funde con la siguiente */
mask-image: linear-gradient(to bottom, #000 0,
            #000 calc(100% - var(--scene-fade-depth)), transparent 100%);

/* viñeta radial para enfocar centro (hero) */
mask-image: radial-gradient(52% 50%, #000f 0%, #000c 48%, #0003 65%, #0000 84%);
```

### 3.6 Scroll

- Lenis con `lerp: 0.1`.
- Reveals: `whileInView` + `viewport={{ once: true, margin: "-15%" }}`, `y: 24`, blur 8px→0, opacity, 0.8s out-expo.
- Parallax sutil: capas de fondo a 0.3x–0.6x del scroll. Mouse parallax en hero: ±8px máximo. Menos es más.

---

## 4. Componentes

### 4.1 Botones

- **Primario:** pill, fondo `--primary-100`, texto negro, weight 500. Hover: leve scale(1.02) + glow cyan exterior (`box-shadow: 0 0 24px rgb(34 211 238/.35)`).
- **Secundario:** pill, fondo transparente, borde `--primary-12`, texto `--primary-100`. Hover: fondo `--primary-4`.
- Transición `--ease-soft` 200ms. Nada de gradientes en botones — la original es austera ahí.

### 4.2 Glass card (técnica extraída — doble clip)

```css
.glass {
  background:
    linear-gradient(var(--glass-bg), var(--glass-bg)) padding-box,
    linear-gradient(var(--glass-border-top) 0%, var(--glass-border-bottom) 100%) border-box;
  border: 1px solid transparent;
  border-radius: 1rem;
  backdrop-filter: blur(4px);   /* la original usa solo 4px — sutileza */
}
```

Hover (tracks): `translateY(-4px)` + tilt ≤3° + glow violeta/cyan según track. `--ease-out-expo` 300ms.

### 4.3 Timeline

Línea vertical 1px `--primary-12`, nodos con glow cyan al activarse por scroll. Cada etapa: microlabel mono (día/hora) + heading h4 + descripción `--primary-60`. Entra con fade-rise escalonado.

### 4.4 Speakers

Card flotante (patrón Float), foto circular con anillo `--primary-12` y glow exterior al hover, nombre h5, rol en microlabel mono cyan.

### 4.5 Partners

Logos `grayscale(1) opacity(.44)` → hover `grayscale(0) opacity(1)`, 300ms `--ease-soft`.

---

## 5. Fondo continuo (regla arquitectónica)

**UNA sola escena Three.js fija (`position: fixed`, z-index -1) para toda la página.** Las secciones son transparentes encima. La cámara/intensidad reacciona al scroll progress global — jamás un canvas por sección.

Capas (de atrás adelante):
1. Gradiente CSS `--bg-scene` (barato, siempre visible — el 3D es mejora progresiva)
2. Estrellas: puntos instanciados, 2 capas con parallax distinto (~3000 + ~1500)
3. Nebulosa: 2-3 planos con textura procedural aditiva, tonos `--accent-blue`/`--accent-violet`, opacidad ≤ .25
4. Polvo: ~200 partículas grandes muy tenues derivando
5. Planeta: esfera con fresnel rim-light cyan, parcialmente fuera de cuadro (abajo-derecha del hero)
6. Estación/satélite: low-poly con patrón Float, catch-light cyan
7. Cometa ocasional: cada 20-40s aleatorio, trail aditivo

Noise overlay global: SVG `feTurbulence` a opacidad .03, `mix-blend-mode: overlay` — mata el banding de los gradientes (el problema n°1 de fondos oscuros).

---

## 6. Estructura del proyecto

```
src/
  app/            layout.tsx (fuentes, Lenis, noise), page.tsx
  components/
    ui/           Button, GlassCard, SectionLabel (mono), CRTPanel
    three/        SpaceScene (dynamic import, ssr:false), Stars, Nebula, Planet, Station, Comet
    effects/      NoiseOverlay, MouseLight, ScrollReveal
  sections/       Hero, About, Timeline, Tracks, Prizes, Speakers, Partners, FAQ, CTA, Footer
  hooks/          useLenis, useMouseParallax, useScrollProgress
  lib/            motion.ts (variants + easings compartidos), constants.ts
```

Reglas de rendimiento (patrones de la original):
- `next/dynamic` para la escena 3D, `ssr: false`, con el gradiente CSS como fallback instantáneo → LCP nunca depende de WebGL.
- `font-display: swap`, woff2, subsets.
- `will-change` solo en elementos animándose (la original lo pone solo durante glitch).
- `prefers-reduced-motion`: matar float/glitch/typewriter, dejar fades.
- DPR cap a 1.5x en la escena, `frameloop="demand"` cuando no hay scroll.

---

## 7. Jerarquía de identidad (si solo hacés 5 cosas, que sean estas)

1. Negro continuo + gradiente petróleo→azul de UNA sola escena
2. Headings clamp() weight 500 tracking -.03em + microlabels mono uppercase cyan
3. Word-reveal con color-flash en el hero
4. Un panel CRT-cyan (timeline o terminal de inscripción) con scanlines/typewriter
5. Escalera de alfas para TODO gris — cero `#888`
