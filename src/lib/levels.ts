/** XP acumulado para chegar ao nível n: 100 × (n−1)^1.5 (igual a public.level_for_xp) */
export function xpForLevel(level: number) {
  return Math.ceil(100 * Math.pow(Math.max(level - 1, 0), 1.5) - 1e-9);
}

export function levelForXp(xp: number) {
  return Math.max(1, Math.floor(Math.pow(Math.max(xp, 0) / 100, 2 / 3) + 1e-9) + 1);
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return { level, start, end, current: xp - start, needed: end - start, pct: (xp - start) / (end - start) };
}

const TITLES: [number, string][] = [
  [1, "Aprendiz de Seda"],
  [3, "Bolador de Esquina"],
  [5, "Artesão do Cone"],
  [8, "Mestre da Seda"],
  [12, "Alquimista da Brasa"],
  [16, "Lorde da Fumaça"],
  [20, "Grão-Mestre"],
  [25, "Lenda do Cone"],
];

export function levelTitle(level: number) {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}

export const LEVEL_TIERS = TITLES.map(([level, title]) => ({ level, title, xp: xpForLevel(level) }));

/** Como cada ação rende XP e Brasas (espelho das regras do banco, para a tela de ajuda) */
export const XP_RULES = [
  { action: "Bônus de boas-vindas", xp: 0, brasas: 50 },
  { action: "Primeira atividade do dia", xp: 10, brasas: 3 },
  { action: "Bolar um bolado (ser o bolador)", xp: 20, brasas: 10 },
  { action: "Registrar o bolado de outra pessoa", xp: 5, brasas: 2 },
  { action: "Avaliar um bolado", xp: 15, brasas: 8 },
  { action: "Receber uma avaliação", xp: 5, brasas: 2 },
  { action: "Receber nota 9 ou mais", xp: 15, brasas: 5 },
  { action: "Enviar foto, vídeo ou link", xp: 5, brasas: 2 },
  { action: "Criar uma roda", xp: 10, brasas: 5 },
  { action: "Subir de nível", xp: 0, brasas: 25 },
];

export const DAILY_XP_CAP = 400;
