import "server-only";
import { CRITERIA } from "./criteria";
import { computeTotal } from "./scoring";
import { deriveType } from "./contents";
import type {
  Badge,
  Bolado,
  BoladoDetail,
  CriterionKey,
  Evaluation,
  Profile,
  ProfileLite,
  ProfileStats,
  RankingRow,
  Roda,
  RodaMember,
  ShopItem,
  UserBadge,
  XpEvent,
  Friend,
  Playbook,
  SkillPeer,
} from "./types";

// Dados fictícios do modo demonstração. Determinísticos para a tela não "pular".

let seed = 42;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const half = (n: number) => Math.max(0, Math.min(10, Math.round(n * 2) / 2));

const now = Date.UTC(2026, 9, 19, 23, 0, 0);
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const H = 3600_000;
const D = 24 * H;

const base = (p: Partial<Profile> & Pick<Profile, "id" | "username" | "display_name">): Profile => ({
  avatar_path: null,
  bio: null,
  is_public: true,
  xp: 0,
  level: 1,
  brasas: 0,
  active_theme: "ouro",
  active_frame: null,
  active_title: null,
  streak: 0,
  created_at: iso(30 * D),
  ...p,
});

export const DEMO_PROFILES: Profile[] = [
  base({ id: "u-joao", username: "joao", display_name: "João Pedro", xp: 4300, level: 13, brasas: 420, streak: 6, active_frame: "coroa", active_title: "Mão de Ouro", bio: "Fundador da roda. Cone perfeito ou nada." }),
  base({ id: "u-bia", username: "bia.seda", display_name: "Bia", xp: 2850, level: 10, brasas: 260, active_frame: "fogo", active_title: "Rei da Seda", bio: "Twist de ponta é arte." }),
  base({ id: "u-caio", username: "caio_brasa", display_name: "Caio", xp: 1950, level: 8, brasas: 150, active_frame: "ouro" }),
  base({ id: "u-duda", username: "duda", display_name: "Duda", xp: 1200, level: 6, brasas: 90, active_title: "O Artesão" }),
  base({ id: "u-leo", username: "leo.cone", display_name: "Léo", xp: 860, level: 5, brasas: 40 }),
  base({ id: "u-mari", username: "mari", display_name: "Mari", xp: 320, level: 3, brasas: 25, is_public: false }),
];

export const DEMO_VIEWER = { id: "u-joao", email: "demo@avaliebolados.app", profile: DEMO_PROFILES[0]! };

const lite = (p: Profile): ProfileLite => ({
  id: p.id,
  username: p.username,
  display_name: p.display_name,
  avatar_path: null,
  avatar_url: null,
  level: p.level,
  active_frame: p.active_frame,
  active_title: p.active_title,
});
const byId = (id: string) => DEMO_PROFILES.find((p) => p.id === id)!;

export const DEMO_RODAS: Roda[] = [
  { id: "r-brabos", name: "Roda dos Brabos", description: "A roda oficial. Nota alta só pra quem merece.", invite_code: "BRABOS42", owner_id: "u-joao", weights: null, created_at: iso(30 * D), members_count: 6, my_role: "owner" },
  { id: "r-firma", name: "Firma de Sexta", description: "Happy hour com avaliação séria.", invite_code: "SEXTA420", owner_id: "u-bia", weights: { construcao: 2 }, created_at: iso(12 * D), members_count: 3, my_role: "member" },
];

const SKILL: Record<string, number> = { "u-joao": 8.6, "u-bia": 8.9, "u-caio": 7.8, "u-duda": 7.2, "u-leo": 6.4, "u-mari": 5.9 };
const COMBOS: string[][] = [
  ["flor"],
  ["tabaco_desfiado", "ice"],
  ["prensado"],
  ["tabaco_desfiado"],
  ["flor", "kief"],
  ["tabaco_aromatizado", "flor", "mentol"],
  ["haxixe", "tabaco_rolo"],
  ["flor", "rosin"],
  ["ervas_blend", "flor"],
  ["dry", "flor"],
  ["ervas_blend", "essencia"],
  ["crumble", "flor"],
];
const PAPERS = ["Seda Smoking Brown", "Seda Bem Bolado Brown", "Seda Raw King Size", "Palha de milho", "Seda Zomo"];
const FILTERS = ["Piteira de papel", "Piteira de vidro", "Piteira longa", "Sem piteira"];
const FEEDBACKS = [
  "Construção impecável, puxada leve do começo ao fim.",
  "Ficou um pouco frouxo na ponta, mas o sabor compensou.",
  "Cone digno de vitrine. Queimou por igual.",
  "Canoou na metade, precisa distribuir melhor.",
  "Momento top, resenha boa demais.",
  "Piteira torta tirou ponto na estética.",
  null,
];

function makeEvaluations(boladoId: string, rollerId: string, at: number, count: number): Evaluation[] {
  const others = DEMO_PROFILES.filter((p) => p.id !== rollerId);
  const evaluators = [...others].sort(() => rand() - 0.5).slice(0, count);
  return evaluators.map((ev, i) => {
    const skill = SKILL[rollerId]!;
    const scores = CRITERIA.filter((c) => !c.optional || rand() > 0.4).map((c) => {
      const score = half(skill + (rand() - 0.5) * 3);
      const checklist = c.checklist.filter(() => rand() < score / 11);
      return { criterion_key: c.key as CriterionKey, score, checklist };
    });
    const total = computeTotal(CRITERIA, Object.fromEntries(scores.map((s) => [s.criterion_key, s.score])))!;
    const created = iso(at - (i + 1) * 20 * 60_000);
    return {
      id: `${boladoId}-e${i}`,
      bolado_id: boladoId,
      evaluator_id: ev.id,
      total,
      feedback: pick(FEEDBACKS),
      airflow: pick(["leve", "ideal", "ideal", "pesado"] as const),
      created_at: created,
      updated_at: created,
      evaluator: lite(ev),
      scores,
    };
  });
}

function buildBolados(): BoladoDetail[] {
  const list: BoladoDetail[] = [];
  const rollers = ["u-joao", "u-bia", "u-caio", "u-duda", "u-leo", "u-mari", "u-bia", "u-joao", "u-caio", "u-duda", "u-joao", "u-bia", "u-leo", "u-caio", "u-mari", "u-joao"];
  rollers.forEach((rollerId, i) => {
    const agoMs = i * 0.9 * D + rand() * 6 * H + 2 * H;
    const id = `b-${i + 1}`;
    const evalCount = i === 0 ? 0 : 2 + Math.floor(rand() * 3);
    const evaluations = makeEvaluations(id, rollerId, agoMs, evalCount);
    const final = evaluations.length
      ? Math.round((evaluations.reduce((s, e) => s + e.total, 0) / evaluations.length) * 100) / 100
      : null;
    const roda = i % 5 === 3 ? DEMO_RODAS[1]! : DEMO_RODAS[0]!;
    const contents = COMBOS[i % COMBOS.length]!;
    const type = deriveType(contents)!;
    list.push({
      id,
      roda_id: roda.id,
      roda_name: roda.name,
      roller_id: rollerId,
      created_by: rollerId,
      type,
      contents,
      mix_tobacco_pct: type === "mesclado" ? [60, 70, 50][i % 3]! : null,
      paper_size: ["King Size", "1¼", "King Size Slim"][i % 3]!,
      weight_g: i % 4 === 0 ? 0.8 : null,
      rolled_at: iso(agoMs),
      paper: pick(PAPERS),
      filter: pick(FILTERS),
      notes: i % 4 === 0 ? "Bolado no capricho pro fim de tarde." : null,
      final_score: final,
      evaluations_count: evaluations.length,
      created_at: iso(agoMs),
      roller: lite(byId(rollerId)),
      cover_url: null,
      media_count: 0,
      media: [],
      evaluations,
    });
  });
  return list;
}

export const DEMO_BOLADOS = buildBolados();

export function demoBolados(): Bolado[] {
  return DEMO_BOLADOS.map(({ media: _m, evaluations: _e, ...b }) => b);
}

export function demoRanking(rodaId: string | null, type?: BoladoDetail["type"]): RankingRow[] {
  const rows = DEMO_BOLADOS.filter(
    (b) => b.final_score != null && (!rodaId || b.roda_id === rodaId) && (!type || b.type === type),
  );
  const mean = rows.length ? rows.reduce((s, b) => s + b.final_score!, 0) / rows.length : 7;
  const members = rodaId === "r-firma" ? DEMO_PROFILES.filter((p) => ["u-joao", "u-bia", "u-caio"].includes(p.id)) : DEMO_PROFILES;
  return members
    .filter((p) => rodaId || p.is_public)
    .map((p) => {
      const mine = rows.filter((b) => b.roller_id === p.id);
      const n = mine.length;
      const avg = n ? mine.reduce((s, b) => s + b.final_score!, 0) / n : null;
      const prior = rodaId ? 3 : 5;
      return {
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_path: null,
        avatar_url: null,
        level: p.level,
        active_frame: p.active_frame,
        active_title: p.active_title,
        bolados: n,
        avg_score: avg == null ? null : Math.round(avg * 100) / 100,
        best_score: n ? Math.max(...mine.map((b) => b.final_score!)) : null,
        nota_ouro: avg == null ? null : Math.round(((prior * mean + n * avg) / (prior + n)) * 100) / 100,
        last_rolled_at: mine[0]?.rolled_at ?? null,
      };
    })
    .filter((r) => rodaId || r.bolados > 0)
    .sort((a, b) => (b.nota_ouro ?? -1) - (a.nota_ouro ?? -1) || b.bolados - a.bolados);
}

export function demoMembers(rodaId: string): RodaMember[] {
  const ids = rodaId === "r-firma" ? ["u-bia", "u-joao", "u-caio"] : DEMO_PROFILES.map((p) => p.id);
  return ids.map((id, i) => ({
    role: i === 0 ? "owner" : i === 1 && rodaId === "r-brabos" ? "admin" : "member",
    joined_at: iso((30 - i) * D),
    profile: lite(byId(id)),
  }));
}

export function demoStats(userId: string): ProfileStats {
  const mine = DEMO_BOLADOS.filter((b) => b.roller_id === userId);
  const scored = mine.filter((b) => b.final_score != null);
  const avgOf = (arr: BoladoDetail[]) =>
    arr.length ? Math.round((arr.reduce((s, b) => s + b.final_score!, 0) / arr.length) * 100) / 100 : null;
  const given = DEMO_BOLADOS.flatMap((b) => b.evaluations).filter((e) => e.evaluator_id === userId);
  const received = mine.flatMap((b) => b.evaluations).flatMap((e) => e.scores);
  const criteria: ProfileStats["criteria"] = {};
  for (const c of CRITERIA) {
    const s = received.filter((x) => x.criterion_key === c.key);
    if (s.length) criteria[c.key] = Math.round((s.reduce((a, x) => a + x.score, 0) / s.length) * 100) / 100;
  }
  const by_type: ProfileStats["by_type"] = {};
  for (const t of ["tabaco", "beck", "mesclado", "cumbaia"] as const) {
    const v = avgOf(scored.filter((b) => b.type === t));
    if (v != null) by_type[t] = v;
  }
  const counts = new Map<string, number>();
  mine.forEach((b) => b.contents?.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
  const top_contents = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
  return {
    by_type,
    top_contents,
    bolados: mine.length,
    avaliados: scored.length,
    avg_tabaco: avgOf(scored.filter((b) => b.type === "tabaco")),
    avg_beck: avgOf(scored.filter((b) => b.type === "beck")),
    best: scored.length ? Math.max(...scored.map((b) => b.final_score!)) : null,
    evaluations_given: given.length,
    avg_given: given.length ? Math.round((given.reduce((s, e) => s + e.total, 0) / given.length) * 100) / 100 : null,
    criteria,
  };
}

export const DEMO_BADGES: Badge[] = [
  { key: "primeiro_cone", name: "Primeiro Cone", description: "Registrou o primeiro bolado.", icon: "cone", rarity: "comum", reward_brasas: 20, sort: 1 },
  { key: "fundador", name: "Fundador", description: "Criou uma roda.", icon: "users", rarity: "comum", reward_brasas: 20, sort: 2 },
  { key: "nota_10", name: "Nota 10", description: "Recebeu uma nota 10 de um avaliador.", icon: "star", rarity: "epica", reward_brasas: 100, sort: 3 },
  { key: "avaliador_justo", name: "Avaliador Justo", description: "Fez 10 avaliações.", icon: "scale", rarity: "rara", reward_brasas: 50, sort: 4 },
  { key: "critico_gourmet", name: "Crítico Gourmet", description: "Fez 50 avaliações.", icon: "chef", rarity: "epica", reward_brasas: 150, sort: 5 },
  { key: "sequencia_7", name: "Chama Acesa", description: "Usou o app 7 dias seguidos.", icon: "flame", rarity: "rara", reward_brasas: 70, sort: 6 },
  { key: "mestre_tabaco", name: "Mestre do Tabaco", description: "5 bolados de tabaco com nota final 8,5 ou mais.", icon: "leaf", rarity: "epica", reward_brasas: 150, sort: 7 },
  { key: "mestre_beck", name: "Mestre do Beck", description: "5 becks com nota final 8,5 ou mais.", icon: "sprout", rarity: "epica", reward_brasas: 150, sort: 8 },
  { key: "mestre_mesclado", name: "Mestre do Mesclado", description: "5 mesclados com nota final 8,5 ou mais.", icon: "flame", rarity: "epica", reward_brasas: 150, sort: 9 },
  { key: "mestre_cumbaia", name: "Mestre do Cumbaibeck", description: "5 cumbaibecks (ervas) com nota final 8,5 ou mais.", icon: "sprout", rarity: "epica", reward_brasas: 150, sort: 10 },
  { key: "laboratorio", name: "Laboratório", description: "Usou 6 conteúdos diferentes nos seus bolados.", icon: "flask", rarity: "rara", reward_brasas: 60, sort: 12 },
  { key: "fotografo", name: "Fotógrafo", description: "Enviou 10 fotos de bolados.", icon: "camera", rarity: "rara", reward_brasas: 50, sort: 9 },
  { key: "cineasta", name: "Cineasta", description: "Enviou 3 vídeos.", icon: "video", rarity: "rara", reward_brasas: 50, sort: 10 },
  { key: "veterano", name: "Veterano", description: "Chegou ao nível 10.", icon: "crown", rarity: "lendaria", reward_brasas: 300, sort: 11 },
];

export function demoUserBadges(userId: string): UserBadge[] {
  const keys = userId === "u-joao" ? ["primeiro_cone", "fundador", "avaliador_justo", "veterano", "mestre_beck"] : ["primeiro_cone"];
  return keys.map((k, i) => ({ badge_key: k, awarded_at: iso((20 - i * 3) * D) }));
}

export const DEMO_SHOP: ShopItem[] = [
  { key: "theme_ouro", kind: "theme", name: "Ouro Noturno", description: "O clássico: preto profundo e ouro.", price: 0, min_level: 1, data: { value: "ouro", swatch: ["#0A0A0A", "#E0A63A"] }, sort: 1 },
  { key: "theme_neblina", kind: "theme", name: "Neblina", description: "Tema claro, cor de fumaça.", price: 100, min_level: 1, data: { value: "neblina", swatch: ["#F2EFEA", "#9A6A1E"] }, sort: 2 },
  { key: "theme_esmeralda", kind: "theme", name: "Esmeralda", description: "Verde profundo com detalhes dourados.", price: 150, min_level: 2, data: { value: "esmeralda", swatch: ["#07120D", "#3DDC97"] }, sort: 3 },
  { key: "theme_brasa", kind: "theme", name: "Brasa", description: "Laranja de ponta acesa.", price: 200, min_level: 3, data: { value: "brasa", swatch: ["#120806", "#FF7A3D"] }, sort: 4 },
  { key: "theme_tabacaria", kind: "theme", name: "Tabacaria", description: "Couro, madeira e papel creme.", price: 250, min_level: 4, data: { value: "tabacaria", swatch: ["#17110C", "#C99A6B"] }, sort: 5 },
  { key: "theme_neon", kind: "theme", name: "Neon 420", description: "Roxo e verde elétrico.", price: 300, min_level: 5, data: { value: "neon", swatch: ["#0B0614", "#B6FF3B"] }, sort: 6 },
  { key: "theme_diamante", kind: "theme", name: "Diamante", description: "Para quem chegou lá: azul gelo e prata.", price: 800, min_level: 10, data: { value: "diamante", swatch: ["#060A10", "#9BE7FF"] }, sort: 7 },
  { key: "frame_ouro", kind: "frame", name: "Aro de Ouro", description: "Moldura dourada simples.", price: 100, min_level: 1, data: { value: "ouro" }, sort: 10 },
  { key: "frame_fogo", kind: "frame", name: "Em Chamas", description: "Moldura com brasa animada.", price: 250, min_level: 3, data: { value: "fogo" }, sort: 11 },
  { key: "frame_fumaca", kind: "frame", name: "Fumaça", description: "Moldura com fumaça girando.", price: 300, min_level: 5, data: { value: "fumaca" }, sort: 12 },
  { key: "frame_coroa", kind: "frame", name: "Coroa", description: "Para a realeza da roda.", price: 600, min_level: 8, data: { value: "coroa" }, sort: 13 },
  { key: "title_artesao", kind: "title", name: "O Artesão", description: "Título exibido no seu perfil e no ranking.", price: 80, min_level: 1, data: { value: "O Artesão" }, sort: 20 },
  { key: "title_critico", kind: "title", name: "Crítico Gourmet", description: "Título exibido no seu perfil e no ranking.", price: 150, min_level: 2, data: { value: "Crítico Gourmet" }, sort: 21 },
  { key: "title_rei", kind: "title", name: "Rei da Seda", description: "Título exibido no seu perfil e no ranking.", price: 200, min_level: 4, data: { value: "Rei da Seda" }, sort: 22 },
  { key: "title_mao", kind: "title", name: "Mão de Ouro", description: "Título exibido no seu perfil e no ranking.", price: 400, min_level: 7, data: { value: "Mão de Ouro" }, sort: 23 },
  { key: "title_lenda", kind: "title", name: "Lenda Viva", description: "Título exibido no seu perfil e no ranking.", price: 1000, min_level: 12, data: { value: "Lenda Viva" }, sort: 24 },
];

export const DEMO_OWNED = ["theme_ouro", "theme_neblina", "theme_brasa", "frame_ouro", "frame_coroa", "title_mao", "title_artesao"];

export const DEMO_XP: XpEvent[] = [
  { id: 6, kind: "evaluation_given", xp: 15, brasas: 8, created_at: iso(2 * H) },
  { id: 5, kind: "daily", xp: 10, brasas: 3, created_at: iso(2.1 * H) },
  { id: 4, kind: "high_score", xp: 15, brasas: 5, created_at: iso(D) },
  { id: 3, kind: "evaluation_received", xp: 5, brasas: 2, created_at: iso(D + H) },
  { id: 2, kind: "bolado_rolled", xp: 20, brasas: 10, created_at: iso(D + 2 * H) },
  { id: 1, kind: "badge:veterano", xp: 0, brasas: 300, created_at: iso(3 * D) },
];

// ---------------------------------------------------------------------------
// Social, nível e playbook (modo demonstração)
// ---------------------------------------------------------------------------
export function demoSkill(userId: string): { bolados: number; nota: number | null } {
  const all = DEMO_BOLADOS.filter((b) => b.final_score != null);
  const mean = all.length ? all.reduce((s, b) => s + b.final_score!, 0) / all.length : 7;
  const mine = all.filter((b) => b.roller_id === userId);
  if (!mine.length) return { bolados: 0, nota: null };
  const avg = mine.reduce((s, b) => s + b.final_score!, 0) / mine.length;
  return { bolados: mine.length, nota: Math.round(((3 * mean + mine.length * avg) / (3 + mine.length)) * 100) / 100 };
}

export function demoFriends(): Friend[] {
  const rel: [string, Friend["status"], Friend["direction"]][] = [
    ["u-bia", "accepted", "outgoing"],
    ["u-caio", "accepted", "incoming"],
    ["u-leo", "accepted", "outgoing"],
    ["u-mari", "pending", "incoming"],
  ];
  return rel.map(([id, status, direction], i) => ({
    ...lite(byId(id)),
    friendship_id: `f-${i}`,
    status,
    direction,
    since: iso((10 - i) * D),
    ...demoSkill(id),
  }));
}

export function demoPeers(): SkillPeer[] {
  const friendIds = new Set(demoFriends().filter((f) => f.status === "accepted").map((f) => f.id));
  return DEMO_PROFILES.filter((p) => p.id !== DEMO_VIEWER.id)
    .map((p) => ({ ...lite(p), is_friend: friendIds.has(p.id), ...demoSkill(p.id) }))
    .filter((p) => p.nota != null);
}

export const DEMO_PLAYBOOKS: Record<string, Playbook> = {
  "u-bia": {
    user_id: "u-bia",
    style: "Cone",
    intro: "Cone fino, ponta torcida e piteira de papelão em W. Bolo devagar, sem pressa.",
    tips: "Distribui o material mais grosso perto da piteira e mais fino na ponta: o cone queima por igual e não canoa.",
    favorite_paper: "Seda brown / natural",
    favorite_filter: "Piteira de papelão pré-cortada",
    favorite_size: "King Size",
    time_minutes: 6,
    updated_at: iso(3 * D),
    steps: [
      { id: "s1", position: 1, title: "Dichava fino", body: "Dichavador de 4 partes, sem talo. O kief que cair guarda pra depois.", media_path: null },
      { id: "s2", position: 2, title: "Piteira em W", body: "Dobra em sanfona (W) e enrola o resto em volta. Firme, mas sem apertar demais.", media_path: null },
      { id: "s3", position: 3, title: "Carrega em cone", body: "Seda com a cola pra cima e de fora pra dentro. Mais material na ponta larga.", media_path: null },
      { id: "s4", position: 4, title: "Enrola e cola", body: "Rola entre os dedos até ficar uniforme, dobra a borda sem cola e sela de baixo pra cima.", media_path: null },
      { id: "s5", position: 5, title: "Compacta e torce", body: "Bate a piteira na mesa, compacta com a ponta de um isqueiro e torce a ponta.", media_path: null },
    ],
  },
  "u-caio": {
    user_id: "u-caio",
    style: "Cilindro",
    intro: "Cilindro grosso de roda, feito pra durar.",
    tips: "Seda de cânhamo segura melhor o cilindro. Molha só a pontinha da cola.",
    favorite_paper: "Seda de cânhamo",
    favorite_filter: "Piteira de vidro",
    favorite_size: "King Size Slim",
    time_minutes: 4,
    updated_at: iso(6 * D),
    steps: [
      { id: "c1", position: 1, title: "Dichava médio", body: "Nem pó, nem pedaço: médio pra puxar fácil.", media_path: null },
      { id: "c2", position: 2, title: "Piteira de vidro", body: "Encaixa na ponta antes de enrolar.", media_path: null },
      { id: "c3", position: 3, title: "Enrola reto", body: "Material distribuído igual de ponta a ponta.", media_path: null },
    ],
  },
};
