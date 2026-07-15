"use client";

import { useEffect, useRef, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";

const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ":": ["00", "11", "11", "00", "11", "11", "00"],
};

const LAYOUT = "00:00:00:00".split("");
const GLYPH_GAP = 2;
const ROWS = 7;
const TOTAL_COLS =
  LAYOUT.reduce((acc, ch) => acc + FONT[ch][0].length, 0) + GLYPH_GAP * (LAYOUT.length - 1);
const TOTAL_DOTS = LAYOUT.reduce((acc, ch) => acc + FONT[ch][0].length * ROWS, 0);

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const s = Math.floor(diff / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 86400))}:${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

export function DotClock({ target }: { target: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [srText, setSrText] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetTime = new Date(target).getTime();
    if (Number.isNaN(targetTime)) {
      setSrText("Fecha de lanzamiento no disponible");
      return;
    }

    const motionPreference = window.matchMedia(REDUCED_MOTION_QUERY);
    const brightness = new Float32Array(TOTAL_DOTS).fill(0.08);

    let raf = 0;
    let interval = 0;
    let lastString = "";
    let cssW = 0;
    let dpr = 1;
    let disposed = false;

    const resize = () => {
      cssW = Math.max(1, canvas.parentElement?.clientWidth ?? 800);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const pitch = cssW / TOTAL_COLS;
      const cssH = pitch * ROWS;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = `${cssH}px`;
    };

    const draw = (animate: boolean) => {
      if (disposed) return;

      const str = remaining(targetTime);
      if (str !== lastString) {
        lastString = str;
        setSrText(str);
      }

      const pitch = cssW / TOTAL_COLS;
      const radius = pitch * 0.3;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, pitch * ROWS);
      ctx.fillStyle = "#fff";

      let colOffset = 0;
      let dotIndex = 0;

      for (let g = 0; g < LAYOUT.length; g++) {
        const rows = FONT[str[g]] ?? FONT["0"];
        const cols = rows[0].length;

        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < cols; x++) {
            const targetBrightness = rows[y][x] === "1" ? 1 : 0.08;
            const i = dotIndex++;

            brightness[i] = animate
              ? brightness[i] + (targetBrightness - brightness[i]) * 0.14
              : targetBrightness;

            ctx.globalAlpha = brightness[i];
            ctx.beginPath();
            ctx.arc((colOffset + x) * pitch + pitch / 2, y * pitch + pitch / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        colOffset += cols + GLYPH_GAP;
      }

      ctx.globalAlpha = 1;

      if (animate) {
        raf = requestAnimationFrame(() => draw(true));
      }
    };

    const start = () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);

      if (motionPreference.matches) {
        draw(false);
        interval = window.setInterval(() => draw(false), 1000);
        return;
      }

      raf = requestAnimationFrame(() => draw(true));
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    motionPreference.addEventListener("change", start);
    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.removeEventListener("resize", resize);
      motionPreference.removeEventListener("change", start);
    };
  }, [target]);

  return (
    <div className="w-full max-w-5xl" role="timer" aria-label="Cuenta regresiva al lanzamiento">
      <span className="sr-only">{srText}</span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        role="presentation"
        className="block w-full [filter:drop-shadow(0_0_8px_rgb(255_255_255/0.3))]"
      />
    </div>
  );
}
