import { cn, typeLabel } from "@/lib/utils";
import type { BoladoType } from "@/lib/types";
import type { ReactNode } from "react";

const TYPE_STYLE: Record<BoladoType, { chip: string; dot: string }> = {
  tabaco: { chip: "border-accent/40 bg-accent/10 text-accent", dot: "bg-accent" },
  beck: { chip: "border-leaf/40 bg-leaf/10 text-leaf", dot: "bg-leaf" },
  mesclado: { chip: "border-ember/40 bg-ember/10 text-ember", dot: "bg-ember" },
  cumbaia: { chip: "border-success/40 bg-success/10 text-success", dot: "bg-success" },
};

export function TypeChip({ type, className }: { type: BoladoType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-0 px-2.5 py-0.5 text-[12px] font-semibold",
        TYPE_STYLE[type].chip,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TYPE_STYLE[type].dot)} />
      {typeLabel(type)}
    </span>
  );
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <h2 className="font-display text-[22px] font-bold leading-7">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-7 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[15px] font-medium text-muted">{eyebrow}</p>}
        <h1 className="font-display text-[34px] font-bold leading-[41px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center text-faint [&_svg]:h-10 [&_svg]:w-10">{icon}</div>}
      <h3 className="font-display text-[20px] font-semibold">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-[15px] text-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("card p-4", className)}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 font-mono text-[28px] font-bold leading-8">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-faint">{hint}</p>}
    </div>
  );
}

/** Ilustração de bolado para quando não há foto. */
export function ConeArt({ type, className }: { type: BoladoType; className?: string }) {
  const leaf = type !== "tabaco";
  const tone = { tabaco: "var(--accent)", beck: "var(--leaf)", mesclado: "var(--ember)", cumbaia: "var(--success)" }[type];
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `color-mix(in oklab, ${tone} 16%, var(--surface-2))`,
      }}
    >
      <svg viewBox="0 0 120 120" className="h-3/5 w-3/5 -rotate-[28deg]" aria-hidden>
        <path d="M60 4c6 8 3 14-1 19-4 5-5 9-1 15" stroke="currentColor" className="text-muted/50" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M46 42h28l-9 70h-10z" fill={leaf ? "#E8DCC4" : "#B88A5E"} />
        <path d="M46 42h28l-1 8H47z" fill={type === "mesclado" ? "#8A6B3E" : type === "cumbaia" ? "#6FA36A" : leaf ? "#7C8F3A" : "#5F6B2E"} />
        <path d="M56.3 98h7.4l-1.7 14h-4z" fill="var(--accent)" />
        <path d="M68 42h6l-9 70h-2z" fill="#000" fillOpacity=".15" />
      </svg>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>;
}
