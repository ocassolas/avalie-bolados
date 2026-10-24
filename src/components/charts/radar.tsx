import { CRITERION_LABEL } from "@/lib/criteria";
import type { CriterionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Radar (teia) das notas por critério, 0 a 10. Opcional: série de comparação. */
export function Radar({
  values,
  compare,
  size = 260,
  className,
  keys = ["bolar", "estetica", "construcao", "crema", "sabor", "experiencia"],
}: {
  values: Partial<Record<CriterionKey, number | null>>;
  compare?: Partial<Record<CriterionKey, number | null>>;
  size?: number;
  className?: string;
  keys?: CriterionKey[];
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 38;
  const n = keys.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 10), cy + Math.sin(a) * R * (v / 10)] as const;
  };
  const poly = (vals: Partial<Record<CriterionKey, number | null>>) =>
    keys.map((k, i) => pt(i, vals[k] ?? 0).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={cn("w-full max-w-[320px]", className)} role="img" aria-label="Notas por critério">
      {[2, 4, 6, 8, 10].map((lvl) => (
        <polygon
          key={lvl}
          points={keys.map((_, i) => pt(i, lvl).join(",")).join(" ")}
          fill={lvl === 10 ? "var(--bg-2)" : "none"}
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}
      {compare && <polygon points={poly(compare)} fill="color-mix(in oklab, var(--fg) 8%, transparent)" stroke="var(--muted)" strokeDasharray="4 4" strokeWidth={1.5} />}
      <polygon points={poly(values)} fill="color-mix(in oklab, var(--accent) 22%, transparent)" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      {keys.map((k, i) => {
        const v = values[k];
        if (v == null) return null;
        const [x, y] = pt(i, v);
        return <circle key={k} cx={x} cy={y} r={3.5} fill="var(--accent-2)" stroke="var(--bg)" strokeWidth={1.5} />;
      })}
      {keys.map((k, i) => {
        const [x, y] = pt(i, 12.6);
        const v = values[k];
        return (
          <g key={k}>
            <text x={x} y={y - 4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--font-geist)">
              {CRITERION_LABEL[k]}
            </text>
            <text x={x} y={y + 10} textAnchor="middle" fontSize="11" fontWeight="600" fill={v == null ? "var(--faint)" : "var(--fg)"} fontFamily="var(--font-geist-mono)">
              {v == null ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
