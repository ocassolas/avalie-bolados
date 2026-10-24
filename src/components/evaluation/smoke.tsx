"use client";

import { useEffect, useRef } from "react";

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  age: number;
  life: number;
  alpha: number;
  seed: number;
};

/**
 * Fumaça em canvas: partículas macias que sobem, abrem e se dissipam com uma
 * leve turbulência. Usa a cor de texto do tema (clara em tema escuro, escura em
 * tema claro), então fica legível em qualquer tema da loja.
 *
 * `origin` é a posição da brasa, em fração da largura/altura do contêiner.
 */
export function Smoke({
  emitting,
  origin = { x: 0.5, y: 0.5 },
  className,
}: {
  emitting: boolean;
  origin?: { x: number; y: number };
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emittingRef = useRef(emitting);
  const originRef = useRef(origin);
  useEffect(() => {
    emittingRef.current = emitting;
    originRef.current = origin;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Sprite de fumaça pré-renderizado (gradiente radial na cor do tema)
    const fg = getComputedStyle(canvas).getPropertyValue("--fg").trim() || "#f4efe6";
    const sprite = document.createElement("canvas");
    const S = 128;
    sprite.width = sprite.height = S;
    const sctx = sprite.getContext("2d")!;
    const g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, hexToRgba(fg, 0.55));
    g.addColorStop(0.45, hexToRgba(fg, 0.22));
    g.addColorStop(1, hexToRgba(fg, 0));
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, S, S);

    const puffs: Puff[] = [];
    let raf = 0;
    let last = performance.now();
    let since = 0;
    let elapsed = 0;
    let startedAt = -1;

    const spawn = () => {
      const ox = originRef.current.x * w;
      const oy = originRef.current.y * h;
      puffs.push({
        x: ox + (Math.random() - 0.5) * 6,
        y: oy,
        vx: (Math.random() - 0.5) * 10,
        vy: -(38 + Math.random() * 34),
        r: 6 + Math.random() * 6,
        grow: 16 + Math.random() * 18,
        age: 0,
        life: 2.4 + Math.random() * 1.6,
        alpha: 0.5 + Math.random() * 0.35,
        seed: Math.random() * 1000,
      });
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      // Começa como uma baforada forte e assenta num fio contínuo
      if (emittingRef.current) {
        if (startedAt < 0) startedAt = elapsed;
        const rate = elapsed - startedAt < 0.6 ? 60 : 22;
        since += dt;
        while (since > 1 / rate) {
          since -= 1 / rate;
          spawn();
        }
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]!;
        p.age += dt;
        if (p.age >= p.life) {
          puffs.splice(i, 1);
          continue;
        }
        const t = p.age / p.life;
        // Turbulência: onda lateral que cresce conforme a fumaça sobe
        p.vx += Math.sin(p.seed + p.age * 2.2 + p.y * 0.018) * 26 * dt;
        p.vx *= 0.985;
        p.vy *= 0.992;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.grow * dt;

        // Entra rápido, some devagar
        const fade = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
        ctx.globalAlpha = Math.max(0, p.alpha * fade * fade);
        const d = p.r * 2;
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, d, d);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}

function hexToRgba(color: string, a: number) {
  const m = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return `rgba(244,239,230,${a})`;
  let hex = m[1]!;
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
