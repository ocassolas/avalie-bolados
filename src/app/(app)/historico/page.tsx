import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { BoladoRow } from "@/components/bolado/bolado-card";
import { PillTabs } from "@/components/ranking/roda-switch";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ScoreValue } from "@/components/ui/score";
import { getBolados, getMyRodas, requireViewer } from "@/lib/data";
import type { Bolado, BoladoType } from "@/lib/types";
import { BOLADO_TYPES, TYPE_INFO } from "@/lib/contents";
import { cn, dayKey, daysAgoIso, formatDate } from "@/lib/utils";

export const metadata = { title: "Histórico" };

const PERIODS: Record<string, { label: string; days: number | null }> = {
  "7d": { label: "7 dias", days: 7 },
  "30d": { label: "30 dias", days: 30 },
  "90d": { label: "90 dias", days: 90 },
  tudo: { label: "Tudo", days: null },
};

export default async function HistoricoPage({ searchParams }: PageProps<"/historico">) {
  const sp = (await searchParams) as { tipo?: string; periodo?: string; quem?: string; roda?: string };
  const [viewer, rodas] = await Promise.all([requireViewer(), getMyRodas()]);
  const period = PERIODS[sp.periodo ?? ""] ? sp.periodo! : "30d";
  const days = PERIODS[period]!.days;
  const type = BOLADO_TYPES.includes(sp.tipo as BoladoType) ? (sp.tipo as BoladoType) : undefined;
  const rodaId = rodas.some((r) => r.id === sp.roda) ? sp.roda : undefined;

  const bolados = await getBolados({
    type,
    rodaId,
    rollerId: sp.quem === "eu" ? viewer.id : undefined,
    from: days ? daysAgoIso(days) : undefined,
    limit: 200,
  });

  // Agrupa por dia (fuso de Brasília)
  const groups = new Map<string, Bolado[]>();
  for (const b of bolados) {
    const k = dayKey(b.rolled_at);
    groups.set(k, [...(groups.get(k) ?? []), b]);
  }

  // Mapa de calor: últimas 12 semanas
  const heatDays = 84;
  const counts = new Map<string, number>();
  for (const b of bolados) counts.set(dayKey(b.rolled_at), (counts.get(dayKey(b.rolled_at)) ?? 0) + 1);
  const cells = Array.from({ length: heatDays }, (_, i) => {
    const k = dayKey(daysAgoIso(heatDays - 1 - i));
    return { k, n: counts.get(k) ?? 0 };
  });
  const max = Math.max(1, ...cells.map((c) => c.n));
  const extra = { tipo: sp.tipo, periodo: sp.periodo, quem: sp.quem, roda: sp.roda };

  return (
    <div>
      <PageHeader eyebrow="Histórico" title="Linha do tempo" subtitle="Cada bolado registrado com dia, hora, notas e mídia. O registro digital da roda." />

      <div className="mb-6 space-y-3">
        <PillTabs basePath="/historico" param="periodo" active={period} extra={extra} options={Object.entries(PERIODS).map(([value, p]) => ({ value, label: p.label }))} />
        <PillTabs basePath="/historico" param="tipo" active={type ?? "todos"} extra={extra} options={[{ value: "todos", label: "Todos os tipos" }, ...BOLADO_TYPES.map((t) => ({ value: t, label: TYPE_INFO[t].label }))]} />
        <PillTabs basePath="/historico" param="quem" active={sp.quem === "eu" ? "eu" : "todos"} extra={extra} options={[{ value: "todos", label: "Todo mundo" }, { value: "eu", label: "Só os meus" }]} />
        {rodas.length > 1 && (
          <PillTabs basePath="/historico" param="roda" active={rodaId ?? "todas"} extra={extra} options={[{ value: "todas", label: "Todas as rodas" }, ...rodas.map((r) => ({ value: r.id, label: r.name }))]} />
        )}
      </div>

      {(period !== "7d") && bolados.length > 0 && (
        <div className="card mb-8 overflow-x-auto p-5">
          <p className="mb-3 text-sm font-medium">Atividade nas últimas 12 semanas</p>
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
            {cells.map((c) => (
              <span
                key={c.k}
                title={`${formatDate(c.k + "T12:00:00Z", { day: "2-digit", month: "short" })}: ${c.n} bolado(s)`}
                className={cn("h-3.5 w-3.5 rounded-[4px]", c.n === 0 && "bg-line")}
                style={c.n ? { background: `color-mix(in oklab, var(--accent) ${25 + (c.n / max) * 75}%, var(--surface-2))` } : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {bolados.length === 0 ? (
        <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="Nada neste período" action={<Button asChild variant="gold"><Link href="/bolados/novo">Registrar bolado</Link></Button>}>
          Mude os filtros ou registre um bolado novo.
        </EmptyState>
      ) : (
        <ol className="relative space-y-8 border-l border-line pl-6">
          {[...groups.entries()].map(([day, list]) => {
            const scored = list.filter((b) => b.final_score != null);
            const avg = scored.length ? scored.reduce((s, b) => s + b.final_score!, 0) / scored.length : null;
            return (
              <li key={day}>
                <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-accent" />
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[17px] font-semibold capitalize">
                    {formatDate(day + "T12:00:00Z", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <span className="text-xs text-muted">
                    {list.length} bolado{list.length > 1 ? "s" : ""}
                    {avg != null && <> · média <ScoreValue value={avg} /></>}
                  </span>
                </div>
                <div className="card divide-y divide-line p-1">
                  {list.map((b) => (
                    <BoladoRow key={b.id} bolado={b} />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
