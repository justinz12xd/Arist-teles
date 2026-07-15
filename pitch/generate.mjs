import pptxgen from "pptxgenjs";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PITCH_DIR = join(ROOT, "pitch");
const PPTX_PATH = join(PITCH_DIR, "Aristoteles-Pitch.pptx");
const PDF_PATH = join(PITCH_DIR, "Aristoteles-Pitch.pdf");
const PDF_BUILD_DIR = join(PITCH_DIR, ".pdf-build");
const PDF_BUILD_PATH = join(PDF_BUILD_DIR, "Aristoteles-Pitch.pdf");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Aristóteles";
pptx.company = "Aristóteles";
pptx.subject = "Pitch técnico para selección de proveedores respaldada por evidencia";
pptx.title = "Aristóteles — de documentos dispersos a decisiones defendibles";
pptx.lang = "es-ES";
pptx.theme = {
  headFontFace: "Noto Sans",
  bodyFontFace: "Noto Sans",
  lang: "es-ES",
};
pptx.defineSlideMaster({
  title: "ORBITAL_BASE",
  background: { color: "030303" },
  objects: [],
});

const S = pptx.ShapeType;
const W = 13.333;
const H = 7.5;
const C = {
  bg: "030303",
  surface: "0A0B0F",
  surface2: "11131A",
  surface3: "171A24",
  white: "F7FAFC",
  muted: "A7B0C0",
  dim: "667085",
  line: "2A3040",
  cyan: "22D3EE",
  blue: "3B82F6",
  violet: "8B5CF6",
  amber: "F59E0B",
  green: "34D399",
  red: "FB7185",
};
const FONT = "Noto Sans";
const MONO = "Liberation Mono";

const notes = [];

function shape(slide, type, opts = {}) {
  slide.addShape(type, opts);
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: FONT,
    fontSize: 12,
    color: C.white,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    valign: "mid",
    ...opts,
  });
}

function mono(slide, value, x, y, w, h, opts = {}) {
  text(slide, value, x, y, w, h, {
    fontFace: MONO,
    fontSize: 8,
    color: C.cyan,
    charSpacing: 1.1,
    ...opts,
  });
}

function line(slide, x, y, w, h, color = C.line, width = 1, transparency = 0) {
  shape(slide, S.line, { x, y, w, h, line: { color, width, transparency } });
}

function dot(slide, x, y, size, color, transparency = 0) {
  shape(slide, S.ellipse, {
    x,
    y,
    w: size,
    h: size,
    fill: { color, transparency },
    line: { color, transparency: 100 },
  });
}

function card(slide, x, y, w, h, opts = {}) {
  shape(slide, S.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: opts.fill ?? C.surface, transparency: opts.transparency ?? 0 },
    line: { color: opts.line ?? C.line, transparency: opts.lineTransparency ?? 0, width: opts.lineWidth ?? 0.7 },
  });
}

function pill(slide, label, x, y, w, color = C.cyan, fill = C.surface2) {
  shape(slide, S.roundRect, {
    x,
    y,
    w,
    h: 0.28,
    rectRadius: 0.12,
    fill: { color: fill },
    line: { color, transparency: 40, width: 0.7 },
  });
  mono(slide, label, x + 0.09, y + 0.02, w - 0.18, 0.21, { color, fontSize: 7.2, charSpacing: 0.75, align: "center" });
}

function addOrbitalBackground(slide, variant = "cyan") {
  slide.background = { color: C.bg };
  const accent = variant === "violet" ? C.violet : C.cyan;
  shape(slide, S.ellipse, {
    x: -1.35,
    y: -1.15,
    w: 5.35,
    h: 3.25,
    fill: { color: C.blue, transparency: 96 },
    line: { color: C.blue, transparency: 100 },
  });
  shape(slide, S.ellipse, {
    x: 9.55,
    y: 5.2,
    w: 5.3,
    h: 3.2,
    fill: { color: accent, transparency: 96 },
    line: { color: accent, transparency: 100 },
  });
  shape(slide, S.ellipse, {
    x: 8.85,
    y: -1.18,
    w: 5.8,
    h: 2.9,
    fill: { color: C.bg, transparency: 100 },
    line: { color: accent, transparency: 73, width: 0.7 },
    rotate: -12,
  });
  shape(slide, S.ellipse, {
    x: 9.25,
    y: -0.68,
    w: 5.1,
    h: 2.2,
    fill: { color: C.bg, transparency: 100 },
    line: { color: C.blue, transparency: 80, width: 0.55 },
    rotate: -12,
  });

  const stars = [
    [0.42, 0.72, 0.025], [1.1, 5.95, 0.018], [2.2, 1.05, 0.017], [3.55, 6.62, 0.027],
    [4.9, 0.58, 0.016], [6.35, 1.08, 0.023], [7.45, 6.65, 0.018], [8.18, 0.72, 0.02],
    [11.68, 3.18, 0.018], [12.62, 5.1, 0.025], [0.3, 3.2, 0.018], [5.45, 6.96, 0.02],
  ];
  for (const [x, y, size] of stars) dot(slide, x, y, size, accent, 12);
}

function addHeader(slide, page, section = "DECISIONES RESPALDADAS POR EVIDENCIA") {
  mono(slide, "ARISTÓTELES  /  SISTEMA MULTIAGENTE", 0.52, 0.28, 4.2, 0.17, { fontSize: 7.2, color: C.cyan, charSpacing: 1.0 });
  mono(slide, section, 8.05, 0.28, 4.42, 0.17, { fontSize: 7.2, color: C.dim, charSpacing: 0.8, align: "right" });
  line(slide, 0.52, 0.55, 12.28, 0, C.line, 0.55, 28);
  mono(slide, String(page).padStart(2, "0"), 12.48, 7.09, 0.33, 0.17, { fontSize: 7, color: C.dim, align: "right", charSpacing: 0.3 });
}

function sectionTitle(slide, label, title, subtitle = "") {
  mono(slide, label, 0.66, 0.88, 3.9, 0.18, { fontSize: 8, color: C.cyan });
  text(slide, title, 0.66, 1.2, 8.65, 0.74, { fontSize: 26, bold: true, color: C.white, breakLine: true, valign: "top" });
  if (subtitle) text(slide, subtitle, 0.68, 1.99, 7.5, 0.38, { fontSize: 10.5, color: C.muted, valign: "top" });
}

function bullet(slide, value, x, y, w, color = C.muted, marker = C.cyan, opts = {}) {
  dot(slide, x, y + 0.11, 0.055, marker);
  text(slide, value, x + 0.18, y, w - 0.18, opts.h ?? 0.32, { fontSize: opts.fontSize ?? 10.5, color, valign: "top", breakLine: true });
}

function agentNode(slide, x, y, w, h, index, name, role, color) {
  card(slide, x, y, w, h, { fill: C.surface2, line: color, lineTransparency: 38 });
  shape(slide, S.ellipse, { x: x + 0.14, y: y + 0.18, w: 0.38, h: 0.38, fill: { color, transparency: 82 }, line: { color, transparency: 20, width: 0.8 } });
  mono(slide, index, x + 0.14, y + 0.26, 0.38, 0.13, { color, fontSize: 7, align: "center", charSpacing: 0.2 });
  text(slide, name, x + 0.63, y + 0.17, w - 0.78, 0.22, { fontSize: 11, bold: true, color: C.white });
  text(slide, role, x + 0.63, y + 0.45, w - 0.78, 0.31, { fontSize: 8.4, color: C.muted, valign: "top", breakLine: true });
}

function addNotes(slide, value) {
  slide.addNotes(value);
  notes.push(value);
}

// 01 — Cover
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "cyan");
  addHeader(slide, 1, "HACKATHON PITCH  /  3–5 MIN");

  mono(slide, "DE DOCUMENTOS DISPERSOS", 0.7, 1.34, 4.1, 0.18, { fontSize: 8.5, color: C.cyan });
  text(slide, "a decisiones\ndefendibles.", 0.66, 1.72, 6.1, 1.55, { fontSize: 35, bold: true, breakLine: true, valign: "top", color: C.white });
  text(slide, "Aristóteles convierte cotizaciones, contratos y garantías\nen una comparación trazable para que una persona decida mejor.", 0.7, 3.58, 5.65, 0.68, { fontSize: 13, color: C.muted, breakLine: true, valign: "top" });
  pill(slide, "SELECCIÓN DE PROVEEDORES", 0.7, 4.58, 2.25, C.cyan);
  pill(slide, "EVIDENCIA + MULTIAGENTES", 3.08, 4.58, 2.22, C.violet);
  mono(slide, "NO TOMA LA DECISIÓN  /  LA HACE DEFENDIBLE", 0.72, 5.3, 4.8, 0.18, { color: C.amber, fontSize: 7.2 });

  // Orbital decision console
  shape(slide, S.ellipse, { x: 7.45, y: 0.98, w: 4.7, h: 4.7, fill: { color: C.bg, transparency: 100 }, line: { color: C.cyan, transparency: 73, width: 0.8 }, rotate: -17 });
  shape(slide, S.ellipse, { x: 7.95, y: 1.47, w: 3.7, h: 3.7, fill: { color: C.bg, transparency: 100 }, line: { color: C.violet, transparency: 78, width: 0.6 }, rotate: -17 });
  dot(slide, 9.72, 2.68, 0.92, C.cyan, 84);
  dot(slide, 10.04, 2.99, 0.28, C.cyan, 0);
  card(slide, 8.18, 2.05, 4.0, 2.7, { fill: C.surface, line: C.cyan, lineTransparency: 34 });
  mono(slide, "EJEMPLO SINTÉTICO  /  DEMO", 8.48, 2.33, 2.9, 0.18, { color: C.amber, fontSize: 7.1 });
  text(slide, "Proveedor B", 8.48, 2.73, 2.25, 0.29, { fontSize: 18, bold: true });
  text(slide, "recomendación con revisión humana", 8.48, 3.05, 2.7, 0.2, { fontSize: 8.7, color: C.muted });
  line(slide, 8.48, 3.48, 3.35, 0, C.line, 0.7);
  mono(slide, "PUNTAJE", 8.48, 3.72, 1.05, 0.17, { color: C.dim, fontSize: 7 });
  text(slide, "84/100", 9.45, 3.64, 1.05, 0.3, { fontSize: 17, bold: true, color: C.cyan });
  mono(slide, "EVIDENCIAS", 10.48, 3.72, 1.0, 0.17, { color: C.dim, fontSize: 7 });
  text(slide, "12", 11.53, 3.64, 0.42, 0.3, { fontSize: 17, bold: true, color: C.white });
  pill(slide, "EVIDENCIA LOCALIZADA", 8.48, 4.16, 1.73, C.green, "11221D");
  mono(slide, "humano al mando", 10.4, 4.23, 1.34, 0.15, { color: C.amber, fontSize: 7.1, align: "right" });
  text(slide, "ARISTÓTELES", 0.7, 6.68, 2.4, 0.27, { fontSize: 13, bold: true, color: C.white });
  mono(slide, "PROCUREMENT CON EVIDENCIA", 3.0, 6.75, 2.5, 0.14, { color: C.dim, fontSize: 7 });
  addNotes(slide, "Abrimos con la promesa: Aristóteles no es otro chatbot. Toma documentos que ya existen —cotizaciones, contratos y garantías— y los convierte en una decisión que se puede revisar, citar y defender. El resumen visual de la derecha es un ejemplo sintético; el usuario conserva la decisión final.");
}

// 02 — Problem
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "violet");
  addHeader(slide, 2, "EL PROBLEMA");
  sectionTitle(slide, "01  /  PROBLEMA", "Comprar no es elegir el precio más bajo.", "Es encontrar la mejor opción cuando la evidencia está repartida en documentos que no hablan el mismo idioma.");

  card(slide, 0.66, 2.72, 3.48, 3.55, { fill: C.surface2, line: C.violet, lineTransparency: 40 });
  mono(slide, "UN EXPEDIENTE TÍPICO", 0.94, 3.0, 2.8, 0.17, { color: C.violet, fontSize: 7.5 });
  const files = [
    ["cotizacion_A.pdf", C.cyan], ["contrato_B.pdf", C.violet], ["garantia_C.pdf", C.amber], ["anexo_tecnico.pdf", C.blue],
  ];
  files.forEach(([name, color], i) => {
    const yy = 3.43 + i * 0.48;
    shape(slide, S.roundRect, { x: 0.95, y: yy, w: 2.68, h: 0.3, rectRadius: 0.06, fill: { color: C.surface3 }, line: { color, transparency: 34, width: 0.7 } });
    shape(slide, S.rect, { x: 1.08, y: yy + 0.08, w: 0.12, h: 0.13, fill: { color, transparency: 8 }, line: { color, transparency: 100 } });
    mono(slide, name, 1.34, yy + 0.074, 2.0, 0.15, { color: C.muted, fontSize: 7, charSpacing: 0.2 });
  });
  line(slide, 1.1, 5.52, 2.45, 0, C.line, 0.8);
  mono(slide, "MISMA DECISIÓN  /  DISTINTAS FUENTES", 0.95, 5.76, 2.55, 0.16, { color: C.amber, fontSize: 6.7, charSpacing: 0.65 });

  const painX = 4.7;
  const pains = [
    ["Criterios inconsistentes", "Cada evaluador pondera precio, garantía y riesgo de forma distinta."],
    ["Cláusulas que se pierden", "La información importante vive en anexos, tablas y notas al pie."],
    ["Recomendaciones débiles", "El equipo debe reconstruir de dónde salió cada afirmación."],
    ["Datos ausentes invisibles", "Un documento incompleto puede parecer una respuesta completa."],
  ];
  pains.forEach(([title, body], i) => {
    const yy = 2.78 + i * 0.78;
    dot(slide, painX, yy + 0.1, 0.12, i === 3 ? C.amber : C.violet, 8);
    text(slide, title, painX + 0.3, yy, 3.05, 0.2, { fontSize: 12, bold: true, color: C.white });
    text(slide, body, painX + 0.3, yy + 0.25, 4.55, 0.28, { fontSize: 9.3, color: C.muted, valign: "top", breakLine: true });
  });

  card(slide, 9.8, 2.76, 2.86, 2.62, { fill: C.surface, line: C.amber, lineTransparency: 35 });
  mono(slide, "EL COSTO REAL", 10.1, 3.04, 2.1, 0.17, { color: C.amber, fontSize: 7.3 });
  text(slide, "Retrabajo", 10.1, 3.46, 1.9, 0.25, { fontSize: 14, bold: true });
  text(slide, "para volver a encontrar\nla fuente de la verdad.", 10.1, 3.78, 2.15, 0.48, { fontSize: 10.5, color: C.muted, breakLine: true, valign: "top" });
  line(slide, 10.1, 4.54, 2.1, 0, C.line, 0.7);
  mono(slide, "EL RIESGO NO DESAPARECE", 10.1, 4.78, 2.2, 0.15, { color: C.white, fontSize: 6.7 });
  mono(slide, "SE VUELVE INVISIBLE", 10.1, 5.02, 2.15, 0.15, { color: C.amber, fontSize: 7.4 });
  addNotes(slide, "El problema no es que falte información. Es que la información relevante está fragmentada y cada comparación se vuelve artesanal. Eso crea cuatro fallos: criterios inconsistentes, cláusulas omitidas, recomendaciones difíciles de defender y datos faltantes que pasan inadvertidos.");
}

// 03 — Scale
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "cyan");
  addHeader(slide, 3, "LA ESCALA");
  sectionTitle(slide, "02  /  ESCALA", "Una decisión pequeña puede mover recursos enormes.", "La selección de proveedores está dentro de una de las superficies económicas más grandes y sensibles del mundo.");

  const metricCards = [
    { x: 0.66, w: 3.7, value: "17.4%", label: "del gasto público total", detail: "promedio LAC* · 2021", source: "OECD", color: C.cyan },
    { x: 4.8, w: 3.7, value: "6.6%", label: "de contratación / PIB", detail: "promedio LAC* · 2021", source: "OECD", color: C.violet },
    { x: 8.94, w: 3.72, value: "US$9,5 billones", label: "en contratos públicos / año", detail: "estimación global · 2020", source: "WORLD BANK", color: C.amber },
  ];
  metricCards.forEach((m) => {
    card(slide, m.x, 2.82, m.w, 2.18, { fill: C.surface2, line: m.color, lineTransparency: 34 });
    mono(slide, m.source, m.x + 0.25, 3.1, m.w - 0.5, 0.16, { color: m.color, fontSize: 7.4 });
    text(slide, m.value, m.x + 0.25, 3.47, m.w - 0.5, 0.5, { fontSize: 29, bold: true, color: C.white });
    text(slide, m.label, m.x + 0.25, 4.08, m.w - 0.5, 0.24, { fontSize: 11.5, bold: true, color: C.white });
    mono(slide, m.detail, m.x + 0.25, 4.48, m.w - 0.5, 0.15, { color: C.dim, fontSize: 6.8, charSpacing: 0.4 });
  });

  card(slide, 0.66, 5.42, 12.0, 0.95, { fill: C.surface, line: C.line, lineTransparency: 25 });
  mono(slide, "POR QUÉ IMPORTA", 0.98, 5.67, 1.35, 0.15, { color: C.cyan, fontSize: 7.2 });
  text(slide, "Más que ahorrar tiempo, buscamos elevar la calidad de cada decisión: valor por dinero, menor riesgo y una trazabilidad que resista la revisión.", 2.52, 5.58, 8.6, 0.34, { fontSize: 12, color: C.white, bold: true, valign: "top", breakLine: true });
  mono(slide, "FUENTES COMPLETAS EN SOURCES.MD", 10.62, 5.72, 1.7, 0.15, { color: C.dim, fontSize: 6.4, align: "right" });
  mono(slide, "* LAC = países con datos disponibles", 0.7, 6.5, 3.4, 0.15, { color: C.dim, fontSize: 6.5 });
  mono(slide, "OECD · GOVERNMENT AT A GLANCE LAC 2024 · DATOS 2021", 0.7, 6.78, 4.8, 0.15, { color: C.dim, fontSize: 6.7 });
  mono(slide, "WORLD BANK · PROCUREMENT FOR DEVELOPMENT · ESTIMACIÓN 2020", 7.28, 6.78, 5.1, 0.15, { color: C.dim, fontSize: 6.7, align: "right" });
  addNotes(slide, "La oportunidad es grande, pero no hace falta exagerarla. La OCDE reporta que la contratación pública representó en promedio 17.4% del gasto público total y 6.6% del PIB en América Latina y el Caribe en 2021, entre países con datos disponibles. El Banco Mundial estima US$9,5 billones —escala larga— en contratos públicos globales por año, con una estimación publicada en 2020. Aristóteles entra por un punto de entrada claro: comparar proveedores con evidencia.");
}

// 04 — Solution
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "violet");
  addHeader(slide, 4, "LA SOLUCIÓN");
  sectionTitle(slide, "03  /  SOLUCIÓN", "Una capa de decisión sobre tus documentos.", "Aristóteles convierte archivos heterogéneos en criterios explícitos, hechos localizables y una recomendación no vinculante.");

  const columns = [
    { x: 0.7, color: C.cyan, title: "1. INGESTA", body: "PDFs, imágenes, contratos,\ncotizaciones y garantías.", tag: "DOCUMENTOS" },
    { x: 4.48, color: C.violet, title: "2. EVIDENCIA", body: "Hechos, citas, páginas,\nriesgos y datos faltantes.", tag: "CORPUS RAG" },
    { x: 8.26, color: C.amber, title: "3. DECISIÓN", body: "Comparación ponderada\n+ revisión humana.", tag: "REPORTE" },
  ];
  columns.forEach((c, i) => {
    card(slide, c.x, 2.72, 3.16, 2.18, { fill: C.surface2, line: c.color, lineTransparency: 35 });
    mono(slide, c.tag, c.x + 0.27, 3.02, 2.4, 0.16, { color: c.color, fontSize: 7.3 });
    text(slide, c.title, c.x + 0.27, 3.45, 2.5, 0.24, { fontSize: 13, bold: true, color: C.white });
    text(slide, c.body, c.x + 0.27, 3.85, 2.4, 0.5, { fontSize: 11, color: C.muted, breakLine: true, valign: "top" });
    line(slide, c.x + 0.27, 4.54, 2.6, 0, c.color, 1.2, 20);
    dot(slide, c.x + 2.63, 4.49, 0.11, c.color);
    if (i < 2) {
      line(slide, c.x + 3.18, 3.78, 0.57, 0, c.color, 1.1, 10);
      shape(slide, S.chevron, { x: c.x + 3.5, y: 3.67, w: 0.18, h: 0.22, fill: { color: c.color }, line: { color: c.color, transparency: 100 } });
    }
  });

  card(slide, 0.7, 5.35, 11.94, 1.0, { fill: C.surface, line: C.line, lineTransparency: 25 });
  const outcomes = [
    ["COMPARABLE", "mismos criterios", C.cyan],
    ["CITABLE", "cada afirmación localizada", C.violet],
    ["HUMANA", "la decisión sigue siendo tuya", C.amber],
  ];
  outcomes.forEach(([name, body, color], i) => {
    const x = 1.0 + i * 3.84;
    dot(slide, x, 5.76, 0.1, color);
    mono(slide, name, x + 0.2, 5.69, 1.6, 0.16, { color, fontSize: 7.1 });
    text(slide, body, x + 0.2, 5.98, 2.95, 0.19, { fontSize: 9.5, color: C.muted });
  });
  addNotes(slide, "La solución tiene tres movimientos. Primero, prepara la evidencia: extracción, OCR, segmentación y recuperación. Después, hace explícitos los hechos, las citas, los riesgos y lo que falta. Finalmente, compara bajo criterios confirmados por el usuario y entrega una recomendación que siempre puede terminar en revisión humana.");
}

// 05 — Multi-agent flow
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "cyan");
  addHeader(slide, 5, "ARQUITECTURA MULTIAGENTE");
  sectionTitle(slide, "04  /  MULTIAGENTES", "No es un agente que habla. Es un sistema que verifica.", "Cada agente tiene una responsabilidad estrecha; las operaciones críticas siguen siendo deterministas y validables.");

  const nodes = [
    [0.72, 2.8, "01", "DOCUMENT", "prepara el corpus", C.cyan],
    [3.22, 2.8, "02", "PLANNER", "propone criterios", C.blue],
    [5.72, 2.8, "03", "RESEARCH", "extrae hechos", C.violet],
    [8.22, 2.8, "04", "COMPARISON", "aplica pesos", C.amber],
    [10.72, 2.8, "05", "DECISION", "recomienda o se abstiene", C.green],
  ];
  nodes.forEach(([x, y, index, name, role, color], i) => {
    agentNode(slide, x, y, 1.92, 1.12, index, name, role, color);
    if (i < nodes.length - 1) {
      line(slide, x + 1.95, y + 0.56, 0.46, 0, color, 1.0, 8);
      shape(slide, S.chevron, { x: x + 2.2, y: y + 0.48, w: 0.14, h: 0.18, fill: { color }, line: { color, transparency: 100 } });
    }
  });

  card(slide, 0.72, 4.38, 5.72, 1.56, { fill: C.surface2, line: C.cyan, lineTransparency: 45 });
  mono(slide, "HERRAMIENTAS DETERMINISTAS", 1.02, 4.7, 2.65, 0.16, { color: C.cyan, fontSize: 7.5 });
  text(slide, "OCR  ·  parsing  ·  chunking  ·  búsqueda  ·  scoring  ·  PDF", 1.02, 5.06, 4.9, 0.23, { fontSize: 11, bold: true, color: C.white });
  text(slide, "El modelo decide qué herramienta usar; la herramienta define cómo se ejecuta y valida.", 1.02, 5.43, 4.75, 0.3, { fontSize: 9.2, color: C.muted, breakLine: true, valign: "top" });

  card(slide, 6.75, 4.38, 5.92, 1.56, { fill: C.surface2, line: C.violet, lineTransparency: 45 });
  mono(slide, "CONTROL DE ALCANCE", 7.05, 4.7, 2.4, 0.16, { color: C.violet, fontSize: 7.5 });
  bullet(slide, "No interpreta fuera de su rol", 7.05, 5.02, 4.9, C.white, C.violet, { fontSize: 9.5, h: 0.2 });
  bullet(slide, "No afirma sin evidencia asociada", 7.05, 5.32, 4.9, C.white, C.violet, { fontSize: 9.5, h: 0.2 });
  bullet(slide, "Puede responder: needs_review", 7.05, 5.62, 4.9, C.amber, C.amber, { fontSize: 9.5, h: 0.2 });
  mono(slide, "PLANNER  →  PLAN DE ANÁLISIS", 0.72, 6.72, 3.5, 0.15, { color: C.dim, fontSize: 6.8 });
  mono(slide, "5 AGENTES  +  1 HUMANO  +  HERRAMIENTAS REPRODUCIBLES", 7.0, 6.72, 5.65, 0.15, { color: C.dim, fontSize: 6.8, align: "right" });
  addNotes(slide, "Aquí está la diferencia técnica. No proponemos un modelo gigante con una instrucción enorme. Proponemos cinco agentes especializados y herramientas deterministas. El Planner propone el plan; Document prepara; Research extrae; Comparison aplica los pesos; Decision recomienda o se abstiene. Y el humano confirma los criterios y conserva el control.");
}

// 06 — Trust
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "violet");
  addHeader(slide, 6, "CONFIANZA Y EVIDENCIA");
  sectionTitle(slide, "05  /  CONFIANZA", "La confianza no la inventa el modelo.", "Se calcula desde la calidad de la evidencia y se degrada cuando faltan datos o las fuentes se contradicen.");

  card(slide, 0.68, 2.72, 5.24, 3.42, { fill: C.surface2, line: C.violet, lineTransparency: 40 });
  mono(slide, "RÚBRICA EXPLICABLE", 0.98, 3.02, 2.25, 0.16, { color: C.violet, fontSize: 7.4 });
  const weights = [
    ["Cobertura de criterios", "40%", C.cyan],
    ["Respaldo mediante citas", "30%", C.blue],
    ["Consistencia entre fuentes", "20%", C.violet],
    ["Calidad de extracción", "10%", C.amber],
  ];
  weights.forEach(([label, value, color], i) => {
    const yy = 3.46 + i * 0.48;
    text(slide, label, 0.98, yy, 2.6, 0.19, { fontSize: 9.7, color: C.white });
    shape(slide, S.roundRect, { x: 3.67, y: yy + 0.04, w: 1.37, h: 0.12, rectRadius: 0.05, fill: { color: C.surface3 }, line: { color: C.surface3, transparency: 100 } });
    shape(slide, S.roundRect, { x: 3.67, y: yy + 0.04, w: 1.37 * (parseInt(value) / 40), h: 0.12, rectRadius: 0.05, fill: { color, transparency: 8 }, line: { color, transparency: 100 } });
    text(slide, value, 5.2, yy - 0.03, 0.42, 0.22, { fontSize: 10.2, bold: true, color });
  });
  line(slide, 0.98, 5.45, 4.28, 0, C.line, 0.7);
  mono(slide, "≥ 0.80  ALTA   /   ≥ 0.60  MEDIA   /   < 0.60  BAJA", 0.98, 5.72, 4.35, 0.16, { color: C.dim, fontSize: 6.65, charSpacing: 0.25 });

  card(slide, 6.3, 2.72, 6.34, 3.42, { fill: C.surface, line: C.cyan, lineTransparency: 42 });
  mono(slide, "EJEMPLO SINTÉTICO  /  EVIDENCIA", 6.62, 3.02, 3.3, 0.16, { color: C.amber, fontSize: 7.4 });
  card(slide, 6.62, 3.43, 5.7, 1.05, { fill: C.surface2, line: C.line, lineTransparency: 20 });
  mono(slide, "Oferta_B.pdf  ·  página 8  ·  chunk 4f9a", 6.9, 3.69, 3.9, 0.15, { color: C.dim, fontSize: 6.7 });
  text(slide, "“Garantía de 24 meses para equipos\ninstalados por personal autorizado.”", 6.9, 3.98, 4.85, 0.38, { fontSize: 11, italic: true, color: C.white, breakLine: true, valign: "top" });
  pill(slide, "CITA LOCALIZABLE", 6.9, 4.67, 1.55, C.green, "11221D");
  pill(slide, "SIN INFERENCIA", 8.62, 4.67, 1.4, C.cyan, C.surface2);
  mono(slide, "REGLA DE ORO", 6.62, 5.24, 1.6, 0.16, { color: C.amber, fontSize: 7.2 });
  text(slide, "Sin evidencia, no hay hecho.\nCon contradicción crítica, hay revisión.", 6.62, 5.53, 4.82, 0.42, { fontSize: 13, bold: true, color: C.white, breakLine: true, valign: "top" });
  addNotes(slide, "La confianza es una rúbrica, no una sensación del modelo: 40% cobertura, 30% citas, 20% consistencia y 10% calidad de extracción. Cada hecho se enlaza con documento, página y fragmento. Si falta un dato crítico o aparece una contradicción, la confianza baja y el sistema puede pedir revisión en vez de fingir certeza.");
}

// 07 — Synthetic demo
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "cyan");
  addHeader(slide, 7, "DEMO SINTÉTICA");
  sectionTitle(slide, "06  /  DEMO", "Tres proveedores. Un criterio común.\nUna decisión que se puede auditar.", "Ilustración sintética del flujo del MVP: mismos pesos, evidencia localizada y riesgos visibles.");

  // Comparison table
  const tx = 0.68;
  const widths = [2.45, 1.42, 1.3, 1.3, 1.3, 1.3, 1.3];
  const heads = ["PROVEEDOR", "PRECIO", "GARANTÍA", "ENTREGA", "AJUSTE", "RIESGO*", "TOTAL"];
  let xx = tx;
  heads.forEach((head, i) => {
    card(slide, xx, 2.87, widths[i], 0.38, { fill: i === 6 ? "11221D" : C.surface3, line: i === 6 ? C.green : C.line, lineTransparency: 28 });
    mono(slide, head, xx + 0.1, 2.99, widths[i] - 0.2, 0.13, { color: i === 6 ? C.green : C.dim, fontSize: 6.7, align: i === 0 ? "left" : "center", charSpacing: 0.35 });
    xx += widths[i] + 0.07;
  });
  const providers = [
    ["A · VERTEX", [72, 85, 68, 82, 58], 74, C.blue],
    ["B · NEXUS", [78, 92, 82, 88, 79], 84, C.cyan],
    ["C · ORBIT", [88, 76, 61, 73, 55], 71, C.violet],
  ];
  providers.forEach(([name, scores, total, color], r) => {
    let x = tx;
    const yy = 3.37 + r * 0.55;
    const vals = [name, ...scores, total];
    vals.forEach((value, i) => {
      card(slide, x, yy, widths[i], 0.44, { fill: i === 6 && r === 1 ? "11221D" : C.surface2, line: i === 6 && r === 1 ? C.green : C.line, lineTransparency: 34 });
      if (i === 0) {
        dot(slide, x + 0.12, yy + 0.16, 0.1, color);
        text(slide, value, x + 0.3, yy + 0.11, widths[i] - 0.4, 0.17, { fontSize: 9, bold: r === 1, color: C.white });
      } else {
        text(slide, String(value), x + 0.08, yy + 0.11, widths[i] - 0.16, 0.17, { fontSize: 10, bold: i === 6 || r === 1, color: i === 6 && r === 1 ? C.green : C.white, align: "center" });
      }
      x += widths[i] + 0.07;
    });
  });

  mono(slide, "* CONTROL DE RIESGO: MÁS ALTO = MENOR EXPOSICIÓN", 0.7, 5.06, 3.8, 0.13, { color: C.dim, fontSize: 6.3 });
  mono(slide, "VERTEX: precio sin instalación  ·  NEXUS: sin alerta  ·  ORBIT: plazo no confirmado", 4.52, 5.06, 7.95, 0.13, { color: C.amber, fontSize: 6.3, align: "right" });
  card(slide, 0.68, 5.5, 6.0, 0.88, { fill: C.surface2, line: C.cyan, lineTransparency: 34 });
  mono(slide, "RESULTADO DEL MOTOR", 0.98, 5.74, 1.9, 0.14, { color: C.cyan, fontSize: 7.1 });
  text(slide, "B · NEXUS  /  COMPARATIVO 84/100", 0.98, 5.98, 5.2, 0.22, { fontSize: 12.5, bold: true, color: C.white });
  mono(slide, "Oferta_B.pdf p.8  ·  Contrato_B.pdf p.3  ·  12 evidencias", 0.98, 6.24, 5.15, 0.12, { color: C.dim, fontSize: 6.1, align: "left" });
  card(slide, 7.02, 5.5, 5.62, 0.88, { fill: "1B1307", line: C.amber, lineTransparency: 30 });
  mono(slide, "NOTA DE AUDITORÍA", 7.32, 5.74, 1.7, 0.14, { color: C.amber, fontSize: 7.1 });
  text(slide, "Los datos de esta tabla son SINTÉTICOS.", 7.32, 6.0, 4.65, 0.21, { fontSize: 11.3, bold: true, color: C.white });
  addNotes(slide, "Esta es una demo sintética, no un resultado de producción. Los tres proveedores se evalúan con los mismos pesos. Nexus obtiene un puntaje comparativo de 84 sobre 100; no debe confundirse con la confianza, que se calcula con una rúbrica separada de cobertura, citas, consistencia y calidad de extracción. Orbit queda penalizado porque su plazo no está confirmado.");
}

// 08 — Impact / pilot
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "violet");
  addHeader(slide, 8, "IMPACTO Y PILOTO");
  sectionTitle(slide, "07  /  IMPACTO", "Mediremos impacto antes de prometerlo.", "El producto está en implementación: estos son objetivos de piloto y criterios de calidad, no resultados actuales.");

  card(slide, 0.68, 2.75, 3.28, 3.42, { fill: C.surface2, line: C.line, lineTransparency: 28 });
  mono(slide, "HOY  /  BASELINE", 0.98, 3.06, 1.8, 0.16, { color: C.dim, fontSize: 7.5 });
  text(slide, "Manual", 0.98, 3.51, 2.2, 0.36, { fontSize: 21, bold: true, color: C.white });
  bullet(slide, "documentos dispersos", 0.98, 4.17, 2.25, C.muted, C.dim, { fontSize: 9.7, h: 0.21 });
  bullet(slide, "criterios tácitos", 0.98, 4.53, 2.25, C.muted, C.dim, { fontSize: 9.7, h: 0.21 });
  bullet(slide, "revisión difícil de repetir", 0.98, 4.89, 2.35, C.muted, C.dim, { fontSize: 9.7, h: 0.21 });
  mono(slide, "LÍNEA BASE: POR MEDIR", 0.98, 5.65, 2.0, 0.15, { color: C.amber, fontSize: 6.8 });

  card(slide, 4.3, 2.75, 8.35, 3.42, { fill: C.surface, line: C.violet, lineTransparency: 38 });
  mono(slide, "PILOTO  /  OBJETIVOS DE CALIDAD", 4.62, 3.06, 3.1, 0.16, { color: C.violet, fontSize: 7.5 });
  const targets = [
    ["≥ 90%", "precisión de citas", "hechos con página y fragmento", C.cyan],
    ["≥ 95%", "cobertura de criterios", "misma matriz para cada proveedor", C.blue],
    ["100%", "afirmaciones respaldadas", "sin hechos inventados en el reporte", C.green],
    ["0", "cruces de datos", "aislamiento por usuario y expediente", C.amber],
  ];
  targets.forEach(([number, title, detail, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 4.62 + col * 3.82;
    const y = 3.5 + row * 1.12;
    text(slide, number, x, y, 1.1, 0.31, { fontSize: 20, bold: true, color });
    text(slide, title, x + 1.15, y + 0.02, 2.15, 0.2, { fontSize: 10.2, bold: true, color: C.white });
    text(slide, detail, x + 1.15, y + 0.29, 2.3, 0.28, { fontSize: 8.4, color: C.muted, breakLine: true, valign: "top" });
    line(slide, x, y + 0.72, 3.25, 0, C.line, 0.7);
  });
  mono(slide, "MÉTRICAS: RECALL DE EVIDENCIA · PRECISIÓN DE CITAS · ABSTENCIÓN · TIEMPO", 0.7, 6.77, 7.0, 0.15, { color: C.dim, fontSize: 6.6 });
  mono(slide, "NO SON RESULTADOS ACTUALES", 9.75, 6.77, 2.9, 0.15, { color: C.amber, fontSize: 6.8, align: "right" });
  addNotes(slide, "No vamos a inventar impacto antes de medirlo. El piloto debe demostrar calidad: precisión de citas, cobertura de criterios, cero afirmaciones sin respaldo y aislamiento entre usuarios. También mediremos tiempo de revisión y cuándo el sistema sabe abstenerse. El objetivo es que cada mejora tenga una métrica y no solo una demo bonita.");
}

// 09 — Close / roadmap
{
  const slide = pptx.addSlide({ masterName: "ORBITAL_BASE" });
  addOrbitalBackground(slide, "cyan");
  addHeader(slide, 9, "CIERRE");
  mono(slide, "08  /  LA IDEA QUE QUEREMOS QUE RECUERDES", 0.7, 1.02, 4.2, 0.17, { color: C.cyan, fontSize: 8 });
  text(slide, "El jurado no necesita\notro chatbot.", 0.66, 1.48, 6.5, 1.13, { fontSize: 30, bold: true, breakLine: true, valign: "top" });
  text(slide, "Necesita una decisión\nque pueda defender.", 0.66, 2.8, 6.7, 1.08, { fontSize: 30, bold: true, color: C.cyan, breakLine: true, valign: "top" });
  text(slide, "Aristóteles: evidencia antes que elocuencia.\nHumano al mando. Riesgo visible.", 0.7, 4.38, 5.4, 0.62, { fontSize: 13, color: C.muted, breakLine: true, valign: "top" });
  pill(slide, "ARISTÓTELES", 0.7, 5.38, 1.35, C.cyan, "071C22");
  pill(slide, "DECIDE CON EVIDENCIA", 2.25, 5.38, 1.92, C.violet, "151025");

  card(slide, 7.48, 1.28, 5.18, 4.92, { fill: C.surface2, line: C.cyan, lineTransparency: 35 });
  mono(slide, "ROADMAP DE CONSTRUCCIÓN", 7.82, 1.65, 2.7, 0.16, { color: C.cyan, fontSize: 7.5 });
  const roadmap = [
    ["01", "Fundación", "Auth · RLS · Storage", C.cyan],
    ["02", "Ingesta", "OCR · RAG · evaluación", C.blue],
    ["03", "Orquestación", "agentes · checkpoints", C.violet],
    ["04", "Decisión", "citas · confianza · abstención", C.amber],
    ["05", "Entrega", "web · PDF · observabilidad", C.green],
  ];
  roadmap.forEach(([index, title, detail, color], i) => {
    const yy = 2.08 + i * 0.68;
    dot(slide, 7.86, yy + 0.08, 0.12, color);
    if (i < roadmap.length - 1) line(slide, 7.915, yy + 0.2, 0, 0.48, C.line, 0.9);
    mono(slide, index, 8.16, yy + 0.02, 0.35, 0.15, { color, fontSize: 7 });
    text(slide, title, 8.72, yy - 0.02, 1.45, 0.19, { fontSize: 10.5, bold: true, color: C.white });
    text(slide, detail, 10.14, yy - 0.02, 2.08, 0.23, { fontSize: 8.4, color: C.muted, valign: "top" });
  });
  line(slide, 7.82, 5.54, 4.32, 0, C.line, 0.7);
  mono(slide, "LA MEJOR DECISIÓN NO DEBE DEPENDER", 7.82, 5.73, 3.95, 0.15, { color: C.dim, fontSize: 6.7 });
  mono(slide, "DE QUIÉN LEYÓ EL ANEXO", 7.82, 5.97, 3.1, 0.15, { color: C.amber, fontSize: 7.4 });
  mono(slide, "GRACIAS  /  PREGUNTAS", 0.7, 6.82, 2.2, 0.15, { color: C.dim, fontSize: 7 });
  addNotes(slide, "Cerramos con la diferencia: no queremos automatizar la responsabilidad; queremos hacerla más rigurosa. Aristóteles prepara la evidencia, muestra los riesgos y deja al humano con una decisión que puede explicar. El roadmap ya está definido: fundación, ingesta, orquestación, decisión y entrega. Gracias.");
}

mkdirSync(PITCH_DIR, { recursive: true });
rmSync(PPTX_PATH, { force: true });
rmSync(PDF_PATH, { force: true });
rmSync(PDF_BUILD_DIR, { recursive: true, force: true });
await pptx.writeFile({ fileName: PPTX_PATH });

const sofficeHome = "/tmp/aristoteles-soffice-profile";
mkdirSync(sofficeHome, { recursive: true });
mkdirSync(PDF_BUILD_DIR, { recursive: true });
try {
  execFileSync(
    "soffice",
    [
      `-env:UserInstallation=file://${sofficeHome}`,
      "--headless",
      "--convert-to",
      "pdf:impress_pdf_Export",
      "--outdir",
      PDF_BUILD_DIR,
      PPTX_PATH,
    ],
    { stdio: "inherit" },
  );
  if (!existsSync(PDF_BUILD_PATH)) {
    throw new Error("LibreOffice completed without producing the expected PDF.");
  }
  renameSync(PDF_BUILD_PATH, PDF_PATH);
} catch (error) {
  console.error("PPTX generated, but LibreOffice could not export the PDF in this environment.");
  console.error("Run the same command on a host with LibreOffice enabled, then validate pitch/Aristoteles-Pitch.pdf.");
  process.exitCode = 1;
} finally {
  rmSync(PDF_BUILD_DIR, { recursive: true, force: true });
}

console.log(`Generated ${PPTX_PATH}`);
if (existsSync(PDF_PATH)) {
  console.log(`Generated ${PDF_PATH}`);
}
console.log(`Slides: ${notes.length}`);
