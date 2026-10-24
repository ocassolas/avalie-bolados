import type { Criterion, CriterionKey } from "./types";

export type ScoreInput = Partial<Record<CriterionKey, number | null>>;
export type Weights = Partial<Record<CriterionKey, number>> | null | undefined;

export function effectiveWeight(c: Criterion, weights: Weights) {
  return weights?.[c.key] ?? c.weight;
}

/**
 * Média ponderada de 0 a 10, a mesma regra de public.submit_evaluation.
 * Critério opcional sem nota sai do cálculo. Retorna null se faltar obrigatório.
 */
export function computeTotal(criteria: Criterion[], scores: ScoreInput, weights?: Weights) {
  let sum = 0;
  let wsum = 0;
  for (const c of criteria) {
    const s = scores[c.key];
    if (s == null) {
      if (!c.optional) return null;
      continue;
    }
    const w = effectiveWeight(c, weights);
    sum += s * w;
    wsum += w;
  }
  if (wsum === 0) return null;
  return Math.round((sum / wsum) * 100) / 100;
}

/** Total parcial: média ponderada só do que já foi preenchido (para a calculadora ao vivo). */
export function computePartial(criteria: Criterion[], scores: ScoreInput, weights?: Weights) {
  let sum = 0;
  let wsum = 0;
  for (const c of criteria) {
    const s = scores[c.key];
    if (s == null) continue;
    const w = effectiveWeight(c, weights);
    sum += s * w;
    wsum += w;
  }
  return wsum === 0 ? null : Math.round((sum / wsum) * 100) / 100;
}

/** Média bayesiana usada no ranking ("Nota Ouro"). */
export function notaOuro(avg: number, n: number, mean: number, prior = 3) {
  return Math.round(((prior * mean + n * avg) / (prior + n)) * 100) / 100;
}

export function formatScore(n: number | null | undefined, digits = 1) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function scoreTier(n: number | null | undefined) {
  if (n == null) return { label: "Sem nota", tone: "muted" as const };
  if (n >= 9.5) return { label: "Obra-prima", tone: "gold" as const };
  if (n >= 8.5) return { label: "Excelente", tone: "gold" as const };
  if (n >= 7) return { label: "Muito bom", tone: "good" as const };
  if (n >= 5) return { label: "Na média", tone: "mid" as const };
  if (n >= 3) return { label: "Precisa treinar", tone: "low" as const };
  return { label: "Desastre", tone: "bad" as const };
}
