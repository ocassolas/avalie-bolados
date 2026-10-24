import { cn } from "@/lib/utils";
import { useId } from "react";

/** Marca vetorial (troféu + bolado + fumaça). Mesma arte de public/brand/logo-mark.svg. */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  const id = useId().replace(/:/g, "");
  const gold = `g${id}`;
  const paper = `p${id}`;
  const clip = `c${id}`;
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id={gold} x1="120" y1="40" x2="390" y2="490" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBDD8F" />
          <stop offset=".45" stopColor="#E9AE45" />
          <stop offset="1" stopColor="#B97D1E" />
        </linearGradient>
        <linearGradient id={paper} x1="228" y1="0" x2="284" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8F6440" />
          <stop offset=".45" stopColor="#C69A6D" />
          <stop offset="1" stopColor="#94673F" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M228 176 L284 176 L266 392 L246 392 Z" />
        </clipPath>
      </defs>
      <path
        fill={`url(#${gold})`}
        className={animated ? "origin-[260px_150px] animate-smoke" : undefined}
        d="M268 22c20 28 12 48-5 68-15 18-21 33-8 54 3 5 2 8-3 9-22-20-26-40-11-63 13-20 28-36 27-68z"
      />
      {[false, true].map((mirror) => (
        <g key={String(mirror)} fill="none" stroke={`url(#${gold})`} strokeLinejoin="round" transform={mirror ? "matrix(-1 0 0 1 512 0)" : undefined}>
          <path strokeWidth="16" strokeLinecap="round" d="M213 206H164c-9 0-13 5-12 14 6 50 28 92 72 116" />
          <path strokeWidth="18" d="M213 199c0 92 16 150 33 194" />
        </g>
      ))}
      <path fill={`url(#${gold})`} d="M238 392h36c-3 26 0 46 28 62H210c28-16 31-36 28-62z" />
      <path fill={`url(#${gold})`} d="M198 464h116c8 0 12 6 13 18H185c1-12 5-18 13-18z" />
      <path fill={`url(#${paper})`} d="M228 176 L284 176 L266 392 L246 392 Z" />
      <g clipPath={`url(#${clip})`} stroke="#6E4A2C" strokeOpacity=".35" strokeWidth="2" fill="none">
        <path d="M222 216l70-22M222 256l70-22M222 296l70-22M222 336l70-22" />
      </g>
      <path fill="#000" fillOpacity=".18" d="M270 176h14l-18 216h-6z" />
      <path fill={`url(#${gold})`} d="M243.3 360h25.4L266 392h-20z" />
      <path fill="#B48A5F" d="M226 178l6-10 6 6 6-9 6 7 6-8 6 7 6-8 6 8 6-6 6 9 2 4z" />
      <g fill="#5F6B2E">
        <circle cx="238" cy="170" r="6" />
        <circle cx="250" cy="165" r="7" />
        <circle cx="263" cy="166" r="6.5" />
        <circle cx="274" cy="171" r="5.5" />
      </g>
      <g fill="#8C9A45">
        <circle cx="245" cy="168" r="3" />
        <circle cx="258" cy="163" r="3" />
        <circle cx="269" cy="169" r="2.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = { sm: "text-[17px]", md: "text-xl", lg: "text-3xl" }[size];
  const mark = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-14 w-14" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={mark} />
      <span className={cn("font-display font-bold leading-none", text)}>
        Avalie <span className="text-accent">Bolados</span>
      </span>
    </span>
  );
}
