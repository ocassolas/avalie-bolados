/**
 * Ranks de habilidade: quem bola no mesmo nível.
 * A base é a Nota Ouro global da pessoa (public.skill_of): média bayesiana de
 * todos os bolados avaliados dela. Para trocar nomes, cores ou faixas, edite só
 * esta lista (do menor para o maior). `min` é a nota mínima para entrar na faixa.
 */
export type Tier = { key: string; name: string; min: number; color: string };

// NOMES PROVISÓRIOS: substituir pela lista oficial da roda.
export const TIERS: Tier[] = [
  { key: "t1", name: "Bronze", min: 0, color: "#b0763f" },
  { key: "t2", name: "Prata", min: 6, color: "#a9b3bd" },
  { key: "t3", name: "Ouro", min: 6.75, color: "#e9ae45" },
  { key: "t4", name: "Platina", min: 7.5, color: "#5fd1c6" },
  { key: "t5", name: "Diamante", min: 8, color: "#7cc4ff" },
  { key: "t6", name: "Mestre", min: 8.5, color: "#c084fc" },
  { key: "t7", name: "Grão-Mestre", min: 9, color: "#ff7a3d" },
  { key: "t8", name: "Lenda", min: 9.5, color: "#fbdd8f" },
];

/** Bolados avaliados necessários para sair da calibração. */
export const TIER_MIN_BOLADOS = 3;

export type TierResult =
  | { status: "calibrating"; tier: null; index: -1; remaining: number }
  | { status: "ranked"; tier: Tier; index: number; next: Tier | null; toNext: number | null };

export function tierFor(nota: number | null | undefined, bolados: number | null | undefined): TierResult {
  const n = bolados ?? 0;
  if (nota == null || n < TIER_MIN_BOLADOS) {
    return { status: "calibrating", tier: null, index: -1, remaining: Math.max(0, TIER_MIN_BOLADOS - n) };
  }
  let index = 0;
  TIERS.forEach((t, i) => {
    if (nota >= t.min) index = i;
  });
  const next = TIERS[index + 1] ?? null;
  return {
    status: "ranked",
    tier: TIERS[index]!,
    index,
    next,
    toNext: next ? Math.round((next.min - nota) * 100) / 100 : null,
  };
}
