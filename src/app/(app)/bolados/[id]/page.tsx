import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ClipboardCheck, Pencil, Scroll, Wind } from "lucide-react";
import { BoladoActions } from "./actions";
import { Radar } from "@/components/charts/radar";
import { MediaGallery } from "@/components/media/gallery";
import { MediaUploader } from "@/components/media/uploader";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConeArt, EmptyState, TypeChip } from "@/components/ui/misc";
import { ScoreRing, ScoreValue, TierLabel } from "@/components/ui/score";
import { getBolado, getCriteria, getRoda, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";
import { formatScore } from "@/lib/scoring";
import type { CriterionKey } from "@/lib/types";
import { CONTENT_BY_KEY, TYPE_INFO } from "@/lib/contents";
import { formatDate, formatTime, relativeTime, withinHours } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/bolados/[id]">) {
  const b = await getBolado((await params).id);
  return { title: b ? `Bolado de ${b.roller.display_name}` : "Bolado" };
}

const AIRFLOW_LABEL = { leve: "Leve", ideal: "No ponto", pesado: "Pesado" } as const;

export default async function BoladoPage({ params }: PageProps<"/bolados/[id]">) {
  const { id } = await params;
  const [viewer, bolado, criteria] = await Promise.all([requireViewer(), getBolado(id), getCriteria()]);
  if (!bolado) notFound();
  const roda = await getRoda(bolado.roda_id);
  const isAdmin = roda?.my_role === "owner" || roda?.my_role === "admin";
  const isRoller = bolado.roller_id === viewer.id;
  const mine = bolado.evaluations.find((e) => e.evaluator_id === viewer.id);
  const canEdit = mine && withinHours(mine.created_at, 24);
  const canDelete = isAdmin || isRoller || bolado.created_by === viewer.id;

  // Média por critério entre os avaliadores
  const avg: Partial<Record<CriterionKey, number>> = {};
  for (const c of criteria) {
    const s = bolado.evaluations.flatMap((e) => e.scores).filter((x) => x.criterion_key === c.key);
    if (s.length) avg[c.key] = Math.round((s.reduce((a, x) => a + x.score, 0) / s.length) * 10) / 10;
  }
  const airflowVotes = bolado.evaluations.map((e) => e.airflow).filter(Boolean) as (keyof typeof AIRFLOW_LABEL)[];
  const airflowTop = airflowVotes.length
    ? (Object.entries(airflowVotes.reduce<Record<string, number>>((m, a) => ({ ...m, [a]: (m[a] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]![0] as keyof typeof AIRFLOW_LABEL)
    : null;
  const cover = bolado.media.find((m) => m.kind === "photo" && m.signed_url);

  return (
    <div className="space-y-8">
      {/* Topo */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="card relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[420px]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.signed_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <ConeArt type={bolado.type} className="absolute inset-0" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
            <div className="text-white">
              <TypeChip type={bolado.type} className="bg-black/40 backdrop-blur" />
              <p className="mt-3 font-display text-3xl font-semibold leading-tight">Bolado de {bolado.roller.display_name.split(" ")[0]}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                <CalendarClock className="h-4 w-4" /> {formatDate(bolado.rolled_at, { weekday: "long", day: "numeric", month: "long" })} às {formatTime(bolado.rolled_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-glow flex flex-col p-6">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/perfil/${bolado.roller.username}`} className="flex min-w-0 items-center gap-3">
              <Avatar name={bolado.roller.display_name} src={bolado.roller.avatar_url} frame={bolado.roller.active_frame} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold hover:text-accent">{bolado.roller.display_name}</p>
                <p className="truncate text-xs text-muted">@{bolado.roller.username} · Nv. {bolado.roller.level}</p>
              </div>
            </Link>
            {canDelete && <BoladoActions id={bolado.id} demo={IS_DEMO} />}
          </div>

          <div className="mt-6 flex items-center gap-5">
            <ScoreRing value={bolado.final_score} size={112} stroke={8} />
            <div>
              <p className="text-[13px] font-semibold text-accent">Nota final</p>
              <TierLabel value={bolado.final_score} className="mt-1 block text-sm text-fg" />
              <p className="mt-1 text-sm text-muted">
                {bolado.evaluations_count} avaliaç{bolado.evaluations_count === 1 ? "ão" : "ões"}
                {airflowTop && <> · ar <strong className="text-fg">{AIRFLOW_LABEL[airflowTop].toLowerCase()}</strong></>}
              </p>
            </div>
          </div>

          {!!bolado.contents?.length && (
            <div className="mt-6">
              <p className="mb-2 text-xs text-muted">O que tem dentro · <span className="text-fg">{TYPE_INFO[bolado.type].label}</span></p>
              <div className="flex flex-wrap gap-1.5">
                {bolado.contents.map((k) => {
                  const c = CONTENT_BY_KEY[k];
                  const tone = c?.group === "tabaco" ? "border-accent/40 text-accent" : c?.group === "cannabis" ? "border-leaf/40 text-leaf" : c?.group === "ervas" ? "border-success/40 text-success" : "border-line-strong text-muted";
                  return (
                    <span key={k} title={c?.hint} className={`rounded-full border bg-bg-2 px-2.5 py-1 text-xs font-medium ${tone}`}>
                      {c?.label ?? k}
                    </span>
                  );
                })}
              </div>
              {bolado.mix_tobacco_pct != null && (
                <div className="mt-3">
                  <div className="flex h-2 overflow-hidden rounded-full">
                    <span className="bg-accent" style={{ width: `${bolado.mix_tobacco_pct}%` }} />
                    <span className="flex-1 bg-leaf" />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">{bolado.mix_tobacco_pct}% tabaco · {100 - bolado.mix_tobacco_pct}% flor/extração</p>
                </div>
              )}
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-line bg-bg-2 p-3">
              <dt className="text-xs text-muted">Seda / papel</dt>
              <dd className="mt-0.5 font-medium">{bolado.paper ?? "—"}{bolado.paper_size && <span className="text-muted"> · {bolado.paper_size}</span>}</dd>
            </div>
            <div className="rounded-xl border border-line bg-bg-2 p-3">
              <dt className="text-xs text-muted">Piteira</dt>
              <dd className="mt-0.5 font-medium">{bolado.filter ?? "—"}</dd>
            </div>
            {bolado.weight_g != null && (
              <div className="rounded-xl border border-line bg-bg-2 p-3">
                <dt className="text-xs text-muted">Peso</dt>
                <dd className="mt-0.5 font-mono font-medium">{Number(bolado.weight_g).toLocaleString("pt-BR")} g</dd>
              </div>
            )}
            {bolado.roda_name && (
              <div className={`${bolado.weight_g != null ? "" : "col-span-2 "}rounded-xl border border-line bg-bg-2 p-3`}>
                <dt className="text-xs text-muted">Roda</dt>
                <dd className="mt-0.5 font-medium">{bolado.roda_name}</dd>
              </div>
            )}
          </dl>
          {bolado.notes && (
            <p className="mt-4 flex gap-2 rounded-xl border border-line bg-bg-2 p-3 text-sm text-muted">
              <Scroll className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {bolado.notes}
            </p>
          )}

          <div className="mt-auto pt-6">
            {isRoller ? (
              <p className="rounded-xl border border-line bg-bg-2 p-3 text-center text-sm text-muted">Esse é seu. Agora é com a roda. 🔥</p>
            ) : mine ? (
              canEdit ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/bolados/${bolado.id}/avaliar`}>
                    <Pencil className="h-4 w-4" /> Editar minha avaliação ({formatScore(mine.total)})
                  </Link>
                </Button>
              ) : (
                <p className="rounded-xl border border-line bg-bg-2 p-3 text-center text-sm text-muted">
                  Você deu <ScoreValue value={mine.total} /> para este bolado.
                </p>
              )
            ) : (
              <Button asChild variant="gold" size="lg" className="w-full">
                <Link href={`/bolados/${bolado.id}/avaliar`}>
                  <ClipboardCheck className="h-5 w-5" /> Avaliar este bolado
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Avaliações */}
        <section>
          <h2 className="mb-4 font-display text-[22px] font-bold">Avaliações</h2>
          {bolado.evaluations.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="Ninguém avaliou ainda">
              Chame a roda. A nota final aparece assim que chegar a primeira avaliação.
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {bolado.evaluations.map((e) => (
                <li key={e.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.evaluator.display_name} src={e.evaluator.avatar_url} frame={e.evaluator.active_frame} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/perfil/${e.evaluator.username}`} className="font-medium hover:text-accent">
                        {e.evaluator.display_name}
                      </Link>
                      <p className="text-xs text-muted">
                        {relativeTime(e.created_at)}
                        {e.updated_at !== e.created_at && " · editada"}
                        {e.airflow && <> · <Wind className="inline h-3 w-3" /> {AIRFLOW_LABEL[e.airflow]}</>}
                      </p>
                    </div>
                    <ScoreValue value={e.total} digits={2} className="text-2xl" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    {criteria.map((c) => {
                      const s = e.scores.find((x) => x.criterion_key === c.key);
                      return (
                        <div key={c.key} className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted">{c.label}</span>
                            <span className="font-mono tabular">{s ? formatScore(s.score) : "—"}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                            <div className="h-full rounded-full bg-foil" style={{ width: `${(s?.score ?? 0) * 10}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {e.scores.some((s) => s.checklist.length) && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {e.scores.flatMap((s) => s.checklist).slice(0, 12).map((item) => (
                        <span key={item} className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-[11px] text-accent">
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {e.feedback && <p className="mt-4 border-l-2 border-accent/50 pl-3 text-sm italic text-fg/85">“{e.feedback}”</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          {Object.keys(avg).length > 0 && (
            <section className="card p-5">
              <h2 className="font-display text-[17px] font-semibold">Média por critério</h2>
              <div className="mt-2 flex justify-center">
                <Radar values={avg} keys={criteria.map((c) => c.key)} />
              </div>
            </section>
          )}
          <section className="card p-5">
            <h2 className="mb-4 font-display text-[17px] font-semibold">Fotos e vídeos</h2>
            {bolado.media.length > 0 && (
              <div className="mb-4">
                <MediaGallery media={bolado.media} viewerId={viewer.id} isAdmin={!!isAdmin} />
              </div>
            )}
            <MediaUploader rodaId={bolado.roda_id} boladoId={bolado.id} demo={IS_DEMO} />
          </section>
        </aside>
      </div>
    </div>
  );
}
