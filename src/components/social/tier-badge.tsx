import { Shield } from "lucide-react";
import { formatScore } from "@/lib/scoring";
import { TIERS, TIER_MIN_BOLADOS, tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

/** Pílula do rank de habilidade (ou "Em calibração"). */
export function TierBadge({ nota, bolados, className, size = "md" }: { nota: number | null | undefined; bolados: number | null | undefined; className?: string; size?: "sm" | "md" }) {
  const t = tierFor(nota, bolados);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  if (t.status === "calibrating") {
    return (
      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-fill font-medium text-muted", pad, className)} title={`Faltam ${t.remaining} bolado(s) avaliado(s) para ganhar rank`}>
        <Shield className="h-3 w-3" /> Em calibração
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold", pad, className)}
      style={{ color: t.tier.color, background: `color-mix(in oklab, ${t.tier.color} 16%, transparent)` }}
      title={`Nota Ouro ${formatScore(nota, 2)}`}
    >
      <Shield className="h-3 w-3" fill="currentColor" fillOpacity={0.25} /> {t.tier.name}
    </span>
  );
}

/** Cartão do rank com a escada de faixas e o quanto falta para subir. */
export function TierCard({ nota, bolados, title = "Seu rank" }: { nota: number | null | undefined; bolados: number | null | undefined; title?: string }) {
  const t = tierFor(nota, bolados);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{title}</p>
          <p className="mt-1 font-display text-[22px] font-bold" style={t.status === "ranked" ? { color: t.tier.color } : undefined}>
            {t.status === "ranked" ? t.tier.name : "Em calibração"}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {t.status === "ranked"
              ? t.next
                ? `Nota Ouro ${formatScore(nota, 2)} · faltam ${formatScore(t.toNext, 2)} para ${t.next.name}`
                : `Nota Ouro ${formatScore(nota, 2)} · topo da escada`
              : `Faltam ${t.remaining} de ${TIER_MIN_BOLADOS} bolados avaliados para ganhar rank`}
          </p>
        </div>
        <Shield className="h-9 w-9 shrink-0" style={{ color: t.status === "ranked" ? t.tier.color : "var(--faint)" }} fill="currentColor" fillOpacity={0.18} />
      </div>
      <ol className="mt-4 flex gap-1" aria-label="Escada de ranks">
        {TIERS.map((tier, i) => (
          <li
            key={tier.key}
            title={`${tier.name} · a partir de ${formatScore(tier.min, 2)}`}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: t.status === "ranked" && i <= t.index ? tier.color : "var(--fill)" }}
          />
        ))}
      </ol>
    </div>
  );
}
