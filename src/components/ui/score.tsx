import { cn } from "@/lib/utils";
import { formatScore, scoreTier } from "@/lib/scoring";

const toneClass = {
  gold: "text-foil",
  good: "text-success",
  mid: "text-fg",
  low: "text-ember",
  bad: "text-danger",
  muted: "text-faint",
};

/** Nota em destaque com cor por faixa. */
export function ScoreValue({ value, className, digits = 1 }: { value: number | null | undefined; className?: string; digits?: number }) {
  const tier = scoreTier(value);
  return <span className={cn("font-mono font-semibold tabular", toneClass[tier.tone], className)}>{formatScore(value, digits)}</span>;
}

/** Selo circular com anel de progresso para a nota final. */
export function ScoreRing({ value, size = 64, stroke = 5, className, label = true }: { value: number | null | undefined; size?: number; stroke?: number; className?: string; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : value / 10;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#score-ring-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
        <defs>
          <linearGradient id="score-ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent-2)" />
            <stop offset="1" stopColor="var(--accent-3)" />
          </linearGradient>
        </defs>
      </svg>
      {label && (
        <span className="absolute inset-0 flex items-center justify-center">
          <ScoreValue value={value} className={size >= 80 ? "text-2xl" : size >= 56 ? "text-base" : "text-xs"} />
        </span>
      )}
    </div>
  );
}

export function TierLabel({ value, className }: { value: number | null | undefined; className?: string }) {
  const tier = scoreTier(value);
  return <span className={cn("text-[13px] font-medium text-muted", className)}>{tier.label}</span>;
}
