"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Flame, Wind, Zap } from "lucide-react";
import { toast } from "sonner";
import { submitEvaluation } from "@/app/actions/app";
import { Radar } from "@/components/charts/radar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { TypeChip } from "@/components/ui/misc";
import { Smoke } from "./smoke";
import { ScoreValue, TierLabel } from "@/components/ui/score";
import { ScoreSlider } from "@/components/ui/slider";
import { PHASE_LABEL } from "@/lib/criteria";
import { computePartial, computeTotal, effectiveWeight, formatScore, type Weights } from "@/lib/scoring";
import type { Airflow, BoladoType, Criterion, CriterionKey, ProfileLite } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type Draft = {
  scores: Partial<Record<CriterionKey, number | null>>;
  checks: Partial<Record<CriterionKey, string[]>>;
  skipBolar: boolean;
  airflow: Airflow | null;
  feedback: string;
};

type Step = { kind: "criterion"; c: Criterion } | { kind: "ignite" } | { kind: "review" };

const AIRFLOW: { value: Airflow; label: string; hint: string }[] = [
  { value: "leve", label: "Leve", hint: "puxa fácil demais" },
  { value: "ideal", label: "No ponto", hint: "puxada perfeita" },
  { value: "pesado", label: "Pesado", hint: "precisa forçar" },
];

export function EvaluationWizard({
  boladoId,
  roller,
  type,
  rolledAt,
  criteria,
  weights,
  initial,
  demo,
}: {
  boladoId: string;
  roller: ProfileLite;
  type: BoladoType;
  rolledAt: string;
  criteria: Criterion[];
  weights: Weights;
  initial?: Draft;
  demo?: boolean;
}) {
  const router = useRouter();
  const storageKey = `ab-eval-draft-${boladoId}`;
  const [draft, setDraft] = useState<Draft>(
    initial ?? { scores: {}, checks: {}, skipBolar: false, airflow: null, feedback: "" },
  );
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ total: number; final: number | null } | null>(null);

  // Rascunho salvo no aparelho
  useEffect(() => {
    if (initial) return;
    try {
      const raw = localStorage.getItem(storageKey);
      // Restaura o rascunho salvo no aparelho (só existe no navegador, por isso no efeito)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, [initial, storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {}
  }, [draft, storageKey]);

  const pre = criteria.filter((c) => c.phase === "pre");
  const pos = criteria.filter((c) => c.phase === "pos");
  const steps: Step[] = [
    ...pre.map((c) => ({ kind: "criterion" as const, c })),
    { kind: "ignite" },
    ...pos.map((c) => ({ kind: "criterion" as const, c })),
    { kind: "review" },
  ];
  const step = steps[stepIdx]!;

  const effectiveScores = useMemo(() => {
    const s = { ...draft.scores };
    if (draft.skipBolar) delete s.bolar;
    return s;
  }, [draft]);
  const partial = computePartial(criteria, effectiveScores, weights);
  const total = computeTotal(criteria, effectiveScores, weights);

  const go = (delta: number) => {
    setDir(delta);
    setStepIdx((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // "Acendi!": toca a animação da brasa e da fumaça e só depois segue pro pós-crema
  const reduceMotion = useReducedMotion();
  const [lit, setLit] = useState(false);
  const igniteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (igniteTimer.current) clearTimeout(igniteTimer.current);
  }, []);
  function ignite() {
    if (reduceMotion) return go(1);
    setLit(true);
    igniteTimer.current = setTimeout(() => {
      setLit(false);
      go(1);
    }, 2300);
  }

  const canAdvance =
    step.kind !== "criterion" ||
    (step.c.key === "bolar" && draft.skipBolar) ||
    draft.scores[step.c.key] != null;

  function setScore(key: CriterionKey, v: number) {
    setDraft((d) => ({ ...d, scores: { ...d.scores, [key]: v } }));
  }
  function toggleCheck(key: CriterionKey, item: string) {
    setDraft((d) => {
      const cur = d.checks[key] ?? [];
      return { ...d, checks: { ...d.checks, [key]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] } };
    });
  }

  function submit() {
    if (total == null) {
      toast.error("Preencha todos os critérios obrigatórios.");
      return;
    }
    const payload = {
      bolado_id: boladoId,
      scores: criteria
        .filter((c) => effectiveScores[c.key] != null)
        .map((c) => ({ key: c.key, score: effectiveScores[c.key]!, checklist: draft.checks[c.key] ?? [] })),
      feedback: draft.feedback.trim() || undefined,
      airflow: draft.airflow,
    };
    start(async () => {
      if (demo) {
        reveal(total, null);
        return;
      }
      const res = await submitEvaluation(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      reveal(res.data!.total, res.data!.final_score);
    });
  }

  function reveal(t: number, final: number | null) {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setResult({ total: t, final });
    const gold = ["#FBDD8F", "#E9AE45", "#B97D1E", "#FFFFFF"];
    confetti({ particleCount: t >= 9 ? 160 : 90, spread: 80, origin: { y: 0.35 }, colors: gold, disableForReducedMotion: true });
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg text-center">
        <div className="card card-glow p-8">
          <p className="text-[13px] font-semibold text-accent">Avaliação enviada</p>
          <p className="mt-6 text-sm text-muted">Sua nota para {roller.display_name}</p>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.15 }}>
            <ScoreValue value={result.total} digits={2} className="block text-7xl" />
          </motion.div>
          <TierLabel value={result.total} className="mt-2 block" />
          {result.final != null && (
            <p className="mt-4 text-sm text-muted">
              Nota final do bolado agora: <ScoreValue value={result.final} digits={2} />
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2 text-sm">
            <span className="flex items-center gap-1 rounded-full bg-fill px-3 py-1 font-mono"><Zap className="h-4 w-4 text-accent" />+15 XP</span>
            <span className="flex items-center gap-1 rounded-full border border-line bg-bg-2 px-3 py-1 font-mono"><Flame className="h-4 w-4 text-ember" />+8 Brasas</span>
          </div>
          {demo && <p className="mt-4 text-xs text-faint">Modo demonstração: nada foi salvo.</p>}
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="gold" onClick={() => router.push(`/bolados/${boladoId}`)}>Ver o bolado</Button>
            <Button asChild variant="outline"><Link href="/inicio">Voltar ao início</Link></Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        {/* Cabeçalho do bolado */}
        <div className="mb-6 flex items-center gap-3">
          <Avatar name={roller.display_name} src={roller.avatar_url} frame={roller.active_frame} size="md" />
          <div className="min-w-0">
            <p className="text-[13px] text-muted">Avaliando</p>
            <p className="truncate font-display text-[20px] font-bold">{roller.display_name}</p>
            <p className="flex items-center gap-2 text-xs text-muted">
              <TypeChip type={type} className="text-[10px]" /> {formatDateTime(rolledAt)}
            </p>
          </div>
        </div>

        {/* Progresso */}
        <div className="mb-6 flex gap-1.5" aria-label={`Etapa ${stepIdx + 1} de ${steps.length}`}>
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i < stepIdx && go(i - stepIdx)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < stepIdx ? "bg-accent" : i === stepIdx ? "bg-accent-2" : "bg-line",
                s.kind === "ignite" && "max-w-6 bg-ember/60",
              )}
              aria-label={`Ir para etapa ${i + 1}`}
              disabled={i >= stepIdx}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepIdx}
            custom={dir}
            initial={{ opacity: 0, x: dir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -30 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step.kind === "criterion" && (
              <CriterionStep
                c={step.c}
                weight={effectiveWeight(step.c, weights)}
                score={draft.scores[step.c.key] ?? null}
                checks={draft.checks[step.c.key] ?? []}
                skipped={step.c.key === "bolar" && draft.skipBolar}
                onSkip={(v) => setDraft((d) => ({ ...d, skipBolar: v }))}
                onScore={(v) => setScore(step.c.key, v)}
                onToggle={(item) => toggleCheck(step.c.key, item)}
                airflow={step.c.key === "crema" ? draft.airflow : undefined}
                onAirflow={(a) => setDraft((d) => ({ ...d, airflow: a }))}
              />
            )}
            {step.kind === "ignite" && <IgniteStep lit={lit} />}
            {step.kind === "review" && (
              <div className="space-y-6">
                <div className="card p-6 text-center">
                  <p className="text-[13px] font-semibold text-accent">Revisão</p>
                  <h2 className="mt-2 font-display text-[22px] font-bold">Confere tudo?</h2>
                  <div className="mt-4 flex justify-center">
                    <Radar values={effectiveScores} keys={criteria.map((c) => c.key)} />
                  </div>
                  <ul className="mt-4 divide-y divide-line text-left">
                    {criteria.map((c, i) => {
                      const v = effectiveScores[c.key];
                      const idx = steps.findIndex((s) => s.kind === "criterion" && s.c.key === c.key);
                      return (
                        <li key={c.key} className="flex items-center justify-between py-2.5">
                          <button type="button" className="text-left text-sm hover:text-accent" onClick={() => go(idx - stepIdx)}>
                            {c.label}
                            <span className="ml-2 font-mono text-xs text-faint">×{effectiveWeight(c, weights).toLocaleString("pt-BR")}</span>
                            {c.key === "bolar" && draft.skipBolar && <span className="ml-2 text-xs text-faint">(pulado)</span>}
                          </button>
                          <ScoreValue value={v ?? null} className="text-base" key={i} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="card p-5">
                  <label htmlFor="feedback" className="text-sm font-medium">
                    Feedback para {roller.display_name.split(" ")[0]} <span className="text-faint">(opcional)</span>
                  </label>
                  <Textarea
                    id="feedback"
                    className="mt-2"
                    maxLength={1000}
                    value={draft.feedback}
                    onChange={(e) => setDraft((d) => ({ ...d, feedback: e.target.value }))}
                    placeholder="O que ficou top? O que dá para melhorar no próximo?"
                  />
                  <p className="mt-1 text-right text-xs text-faint">{draft.feedback.length}/1000</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navegação */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => go(-1)} disabled={stepIdx === 0}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          {step.kind === "review" ? (
            <Button variant="gold" size="lg" onClick={submit} loading={pending} disabled={total == null}>
              <Check className="h-5 w-5" /> Enviar avaliação
            </Button>
          ) : step.kind === "ignite" ? (
            <Button variant="gold" size="lg" onClick={ignite} disabled={lit}>
              <Flame className="h-5 w-5" /> {lit ? "Aceso!" : "Acendi!"}
            </Button>
          ) : (
            <Button variant="gold" size="lg" onClick={() => go(1)} disabled={!canAdvance}>
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Calculadora */}
      <aside className="order-first lg:order-none">
        <div className="card card-glow sticky top-16 p-5 lg:top-10">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-[13px] font-semibold text-accent">Calculadora</p>
              <p className="mt-1 text-xs text-muted lg:mb-3">média ponderada ao vivo</p>
            </div>
            <div className="text-right lg:text-left">
              <ScoreValue value={partial} digits={2} className="text-4xl lg:text-5xl" />
              <TierLabel value={partial} className="block text-[10px]" />
            </div>
          </div>
          <ul className="mt-4 hidden space-y-2 lg:block">
            {criteria.map((c) => {
              const v = effectiveScores[c.key];
              const skipped = c.key === "bolar" && draft.skipBolar;
              return (
                <li key={c.key} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className={cn(skipped ? "text-faint line-through" : "text-muted")}>
                      {c.label} <span className="font-mono text-[11px] text-faint">×{effectiveWeight(c, weights).toLocaleString("pt-BR")}</span>
                    </span>
                    <span className="font-mono tabular">{v == null ? "—" : formatScore(v)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-foil transition-[width] duration-300" style={{ width: `${(v ?? 0) * 10}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 hidden text-[11px] leading-relaxed text-faint lg:block">
            Nota = soma(nota × peso) ÷ soma(pesos). Critério opcional pulado não entra na conta.
          </p>
        </div>
      </aside>
    </div>
  );
}

function CriterionStep({
  c,
  weight,
  score,
  checks,
  skipped,
  onSkip,
  onScore,
  onToggle,
  airflow,
  onAirflow,
}: {
  c: Criterion;
  weight: number;
  score: number | null;
  checks: string[];
  skipped: boolean;
  onSkip: (v: boolean) => void;
  onScore: (v: number) => void;
  onToggle: (item: string) => void;
  airflow?: Airflow | null;
  onAirflow: (a: Airflow) => void;
}) {
  const suggestion = c.checklist.length ? Math.round((checks.length / c.checklist.length) * 20) / 2 : null;
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <span className={c.phase === "pre" ? "text-accent" : "text-ember"}>{PHASE_LABEL[c.phase]}</span>
          <span className="text-faint">· peso {weight.toLocaleString("pt-BR")}</span>
          {c.optional && <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">opcional</span>}
        </div>
        <h2 className="mt-2 font-display text-[34px] font-bold leading-[41px]">{c.label}</h2>
        <p className="mt-2 text-muted">{c.description}</p>
      </div>

      {c.optional && (
        <div className="flex rounded-xl border border-line bg-bg-2 p-1 text-sm">
          <button type="button" onClick={() => onSkip(false)} className={cn("flex-1 rounded-lg py-2 font-medium transition", !skipped ? "bg-surface-2 text-fg" : "text-muted")}>
            Acompanhei o bolamento
          </button>
          <button type="button" onClick={() => onSkip(true)} className={cn("flex-1 rounded-lg py-2 font-medium transition", skipped ? "bg-surface-2 text-fg" : "text-muted")}>
            Pular este critério
          </button>
        </div>
      )}

      {!skipped && (
        <>
          <div className="card p-4">
            <p className="mb-3 text-sm font-medium">Checklist</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.checklist.map((item) => {
                const on = checks.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onToggle(item)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition active:scale-[.99]",
                      on ? "border-accent/60 bg-accent/10 text-fg" : "border-line bg-bg-2 text-muted hover:border-line-strong",
                    )}
                  >
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", on ? "border-accent bg-accent text-accent-fg" : "border-line-strong")}>
                      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
            {suggestion != null && checks.length > 0 && suggestion !== score && (
              <button type="button" onClick={() => onScore(suggestion)} className="mt-3 text-xs text-accent hover:underline">
                Usar nota sugerida pelo checklist: {formatScore(suggestion)}
              </button>
            )}
          </div>

          {airflow !== undefined && (
            <div className="card p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Wind className="h-4 w-4 text-accent" /> Fluxo de ar
              </p>
              <div className="grid grid-cols-3 gap-2">
                {AIRFLOW.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => onAirflow(a.value)}
                    aria-pressed={airflow === a.value}
                    className={cn(
                      "rounded-xl border px-2 py-3 text-center transition",
                      airflow === a.value ? "border-accent bg-accent/10" : "border-line bg-bg-2 hover:border-line-strong",
                    )}
                  >
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="block text-[11px] text-muted">{a.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-end justify-between">
              <p className="text-sm font-medium">Sua nota</p>
              <ScoreValue value={score} className="text-5xl" />
            </div>
            <ScoreSlider value={score} onChange={onScore} label={`Nota de ${c.label}`} className="mt-4" />
            <div className="mt-2 flex justify-between font-mono text-[11px] text-faint">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onScore(n)}
                  className={cn(
                    "h-9 min-w-11 rounded-lg border px-2 font-mono text-sm transition",
                    score === n ? "border-accent bg-accent text-accent-fg" : "border-line bg-bg-2 text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {formatScore(n, n % 1 ? 1 : 0)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Faíscas que saltam da brasa quando acende (posições fixas para a animação ser estável)
const SPARKS = [
  { x: -46, y: -70, d: 0.05, s: 5 },
  { x: 38, y: -84, d: 0.1, s: 4 },
  { x: -18, y: -104, d: 0.18, s: 3 },
  { x: 58, y: -48, d: 0.02, s: 3 },
  { x: -62, y: -38, d: 0.14, s: 4 },
  { x: 12, y: -120, d: 0.24, s: 3 },
  { x: -30, y: -58, d: 0.3, s: 2 },
  { x: 26, y: -62, d: 0.08, s: 2 },
];

function IgniteStep({ lit }: { lit: boolean }) {
  return (
    <div className="card relative px-6 py-16 text-center">
      {/* Brilho quente: fraco esperando, toma o card quando acende */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 50% 32%, color-mix(in srgb, var(--ember) 26%, transparent), transparent 72%)",
          }}
          animate={{ opacity: lit ? 1 : 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="relative mx-auto h-24 w-24">
        {/* Fumaça: nasce na ponta da chama e sobe por cima da tela */}
        <Smoke
          emitting={lit}
          origin={{ x: 0.5, y: 1 }}
          className="pointer-events-none absolute bottom-[62%] left-1/2 z-20 h-[460px] w-[340px] -translate-x-1/2"
        />

        {lit && (
          <>
            {[0, 0.18].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-ember"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.9, delay, ease: "easeOut" }}
              />
            ))}
            {SPARKS.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute left-1/2 top-1/2 rounded-full bg-ember"
                style={{ width: p.s, height: p.s, boxShadow: "0 0 8px var(--ember)" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.85, delay: p.d, ease: [0.2, 0.7, 0.3, 1] }}
              />
            ))}
          </>
        )}

        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-ember/15"
          animate={
            lit
              ? {
                  scale: [1, 1.22, 1.06],
                  boxShadow: [
                    "0 0 0px 0px color-mix(in srgb, var(--ember) 0%, transparent)",
                    "0 0 60px 14px color-mix(in srgb, var(--ember) 55%, transparent)",
                    "0 0 34px 6px color-mix(in srgb, var(--ember) 35%, transparent)",
                  ],
                }
              : { scale: [1, 1.08, 1] }
          }
          transition={lit ? { duration: 0.7, ease: "easeOut" } : { repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <motion.div
            style={{ originY: 1 }}
            animate={lit ? { scaleY: [1, 1.14, 0.95, 1.09, 1], rotate: [0, -3, 2, -1.5, 0] } : { scaleY: 1, rotate: 0 }}
            transition={lit ? { repeat: Infinity, duration: 0.85, ease: "easeInOut" } : { duration: 0.2 }}
          >
            <Flame
              className={cn("h-12 w-12 text-ember transition-[filter] duration-500", lit && "drop-shadow-[0_0_10px_var(--ember)]")}
              fill={lit ? "currentColor" : "none"}
              fillOpacity={lit ? 0.35 : 0}
            />
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={lit ? "lit" : "idle"}
          className="relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {lit ? (
            <>
              <p className="mt-6 text-[13px] font-semibold text-ember">Brasa acesa</p>
              <h2 className="mt-2 font-display text-[34px] font-bold">Aceso.</h2>
              <p className="mx-auto mt-3 max-w-sm text-muted">Puxa com calma e sente a crema. Já vamos pro pós-crema.</p>
            </>
          ) : (
            <>
              <p className="mt-6 text-[13px] font-semibold text-ember">Fim do pré-crema</p>
              <h2 className="mt-2 font-display text-[34px] font-bold">Hora de acender.</h2>
              <p className="mx-auto mt-3 max-w-sm text-muted">
                Agora vem o pós-crema: crema e fluxo de ar, sabor e a experiência. Dá umas puxadas antes de dar nota.
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
