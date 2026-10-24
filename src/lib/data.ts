  import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { IS_DEMO } from "./env";
import { CRITERIA } from "./criteria";
import { supabaseServer, type ServerSupabase } from "./supabase/server";
import * as demo from "./demo";
import type {
  Badge,
  Bolado,
  BoladoDetail,
  BoladoType,
  Criterion,
  Evaluation,
  Media,
  Profile,
  ProfileLite,
  ProfileStats,
  RankingRow,
  Roda,
  RodaMember,
  RodaRole,
  ShopItem,
  UserBadge,
  Viewer,
  XpEvent,
  Friend,
  Playbook,
  Skill,
  SkillPeer,
} from "./types";

const LITE = "id,username,display_name,avatar_path,level,active_frame,active_title";
const SIGN_TTL = 60 * 60;

// ---------------------------------------------------------------------------
// URLs assinadas (buckets privados)
// ---------------------------------------------------------------------------
async function signPaths(sb: ServerSupabase, bucket: "avatars" | "media", paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await sb.storage.from(bucket).createSignedUrls(unique, SIGN_TTL);
  data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  return map;
}

async function withAvatars<T extends { avatar_path: string | null; avatar_url?: string | null }>(sb: ServerSupabase, rows: T[]) {
  const urls = await signPaths(sb, "avatars", rows.map((r) => r.avatar_path));
  return rows.map((r) => ({ ...r, avatar_url: r.avatar_path ? (urls.get(r.avatar_path) ?? null) : null }));
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (IS_DEMO) return demo.DEMO_VIEWER;
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return null;
  const [withUrl] = await withAvatars(sb, [profile]);
  return { id: user.id, email: user.email ?? "", profile: withUrl! };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/entrar");
  // Conta criada pelo Google ainda sem idade/aceites: completa antes de usar o app
  if (!IS_DEMO && !viewer.profile.birthdate) redirect("/completar-cadastro");
  return viewer;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------
export const getCriteria = cache(async (): Promise<Criterion[]> => {
  if (IS_DEMO) return CRITERIA;
  const sb = await supabaseServer();
  const { data } = await sb.from("criteria").select("*").order("sort");
  return (data as Criterion[] | null)?.map((c) => ({ ...c, weight: Number(c.weight) })) ?? CRITERIA;
});

export async function getBadges(): Promise<Badge[]> {
  if (IS_DEMO) return demo.DEMO_BADGES;
  const sb = await supabaseServer();
  const { data } = await sb.from("badges").select("*").order("sort");
  return (data as Badge[]) ?? [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (IS_DEMO) return demo.demoUserBadges(userId);
  const sb = await supabaseServer();
  const { data } = await sb.from("user_badges").select("badge_key,awarded_at").eq("user_id", userId);
  return (data as UserBadge[]) ?? [];
}

export async function getShop(): Promise<{ items: ShopItem[]; owned: string[] }> {
  if (IS_DEMO) return { items: demo.DEMO_SHOP, owned: demo.DEMO_OWNED };
  const sb = await supabaseServer();
  const viewer = await requireViewer();
  const [{ data: items }, { data: owned }] = await Promise.all([
    sb.from("shop_items").select("*").order("sort"),
    sb.from("user_items").select("item_key").eq("user_id", viewer.id),
  ]);
  return { items: (items as ShopItem[]) ?? [], owned: owned?.map((o) => o.item_key as string) ?? [] };
}

export async function getXpEvents(limit = 30): Promise<XpEvent[]> {
  if (IS_DEMO) return demo.DEMO_XP;
  const sb = await supabaseServer();
  const viewer = await requireViewer();
  const { data } = await sb
    .from("xp_events")
    .select("id,kind,xp,brasas,created_at")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as XpEvent[]) ?? [];
}

// ---------------------------------------------------------------------------
// Rodas
// ---------------------------------------------------------------------------
export const getMyRodas = cache(async (): Promise<Roda[]> => {
  if (IS_DEMO) return demo.DEMO_RODAS;
  const sb = await supabaseServer();
  const viewer = await getViewer();
  if (!viewer) return [];
  const { data } = await sb
    .from("roda_members")
    .select("role, roda:rodas(*, roda_members(count))")
    .eq("user_id", viewer.id)
    .order("joined_at");
  type Row = { role: RodaRole; roda: Roda & { roda_members: { count: number }[] } };
  return ((data as unknown as Row[]) ?? []).map(({ role, roda }) => {
    const { roda_members, ...rest } = roda;
    return { ...rest, my_role: role, members_count: roda_members?.[0]?.count ?? 0 };
  });
});

export async function getRoda(id: string): Promise<Roda | null> {
  const rodas = await getMyRodas();
  return rodas.find((r) => r.id === id) ?? null;
}

export async function getRodaMembers(rodaId: string): Promise<RodaMember[]> {
  if (IS_DEMO) return demo.demoMembers(rodaId);
  const sb = await supabaseServer();
  const { data } = await sb
    .from("roda_members")
    .select(`role, joined_at, profile:profiles(${LITE})`)
    .eq("roda_id", rodaId)
    .order("joined_at");
  const rows = (data as unknown as RodaMember[]) ?? [];
  const profiles = await withAvatars(sb, rows.map((r) => r.profile));
  const order: Record<RodaRole, number> = { owner: 0, admin: 1, member: 2 };
  return rows
    .map((r, i) => ({ ...r, profile: profiles[i]! }))
    .sort((a, b) => order[a.role] - order[b.role]);
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------
export async function getRodaRanking(rodaId: string, type?: BoladoType): Promise<RankingRow[]> {
  if (IS_DEMO) return demo.demoRanking(rodaId, type);
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_roda_ranking", { p_roda: rodaId, p_type: type ?? null });
  if (error) return [];
  return withAvatars(sb, normalizeRanking(data));
}

export async function getGlobalRanking(type?: BoladoType): Promise<RankingRow[]> {
  if (IS_DEMO) return demo.demoRanking(null, type);
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_global_ranking", { p_type: type ?? null, p_limit: 50 });
  if (error) return [];
  return withAvatars(sb, normalizeRanking(data));
}

function normalizeRanking(data: unknown): RankingRow[] {
  return ((data as RankingRow[]) ?? []).map((r) => ({
    ...r,
    avg_score: r.avg_score == null ? null : Number(r.avg_score),
    best_score: r.best_score == null ? null : Number(r.best_score),
    nota_ouro: r.nota_ouro == null ? null : Number(r.nota_ouro),
  }));
}

// ---------------------------------------------------------------------------
// Bolados
// ---------------------------------------------------------------------------
export type BoladoFilters = {
  rodaId?: string;
  rollerId?: string;
  type?: BoladoType;
  from?: string;
  to?: string;
  limit?: number;
};

type BoladoRow = Omit<Bolado, "roller" | "roda_name"> & {
  roller: ProfileLite;
  roda: { name: string } | null;
  media: { kind: string; storage_path: string | null }[];
};

export async function getBolados(f: BoladoFilters = {}): Promise<Bolado[]> {
  if (IS_DEMO) {
    return demo
      .demoBolados()
      .filter(
        (b) =>
          (!f.rodaId || b.roda_id === f.rodaId) &&
          (!f.rollerId || b.roller_id === f.rollerId) &&
          (!f.type || b.type === f.type) &&
          (!f.from || b.rolled_at >= f.from) &&
          (!f.to || b.rolled_at <= f.to),
      )
      .slice(0, f.limit ?? 60);
  }
  const sb = await supabaseServer();
  let q = sb
    .from("bolados")
    .select(`*, roller:profiles!bolados_roller_id_fkey(${LITE}), roda:rodas(name), media:bolado_media(kind,storage_path)`)
    .order("rolled_at", { ascending: false })
    .limit(f.limit ?? 60);
  if (f.rodaId) q = q.eq("roda_id", f.rodaId);
  if (f.rollerId) q = q.eq("roller_id", f.rollerId);
  if (f.type) q = q.eq("type", f.type);
  if (f.from) q = q.gte("rolled_at", f.from);
  if (f.to) q = q.lte("rolled_at", f.to);
  const { data } = await q;
  const rows = (data as unknown as BoladoRow[]) ?? [];

  const covers = rows.map((r) => r.media.find((m) => m.kind === "photo")?.storage_path ?? null);
  const [coverUrls, rollers] = await Promise.all([
    signPaths(sb, "media", covers),
    withAvatars(sb, rows.map((r) => r.roller)),
  ]);
  return rows.map(({ roda, media, ...r }, i) => ({
    ...r,
    final_score: r.final_score == null ? null : Number(r.final_score),
    roda_name: roda?.name,
    roller: rollers[i]!,
    cover_url: covers[i] ? (coverUrls.get(covers[i]!) ?? null) : null,
    media_count: media.length,
  }));
}

export async function getBolado(id: string): Promise<BoladoDetail | null> {
  if (IS_DEMO) return demo.DEMO_BOLADOS.find((b) => b.id === id) ?? null;
  const sb = await supabaseServer();
  const { data } = await sb
    .from("bolados")
    .select(
      `*, roller:profiles!bolados_roller_id_fkey(${LITE}), roda:rodas(name),
       media:bolado_media(*),
       evaluations(*, evaluator:profiles!evaluations_evaluator_id_fkey(${LITE}), scores:evaluation_scores(criterion_key,score,checklist))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Omit<BoladoRow, "media"> & { media: Media[]; evaluations: Evaluation[] };

  const mediaUrls = await signPaths(sb, "media", row.media.map((m) => m.storage_path));
  const people = await withAvatars(sb, [row.roller, ...row.evaluations.map((e) => e.evaluator)]);
  const media = row.media
    .map((m) => ({ ...m, signed_url: m.storage_path ? (mediaUrls.get(m.storage_path) ?? null) : null }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const evaluations = row.evaluations
    .map((e, i) => ({
      ...e,
      total: Number(e.total),
      evaluator: people[i + 1]!,
      scores: e.scores.map((s) => ({ ...s, score: Number(s.score) })),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { roda, ...rest } = row;
  const firstPhoto = media.find((m) => m.kind === "photo");
  return {
    ...rest,
    final_score: rest.final_score == null ? null : Number(rest.final_score),
    roda_name: roda?.name,
    roller: people[0]!,
    cover_url: firstPhoto?.signed_url ?? null,
    media_count: media.length,
    media,
    evaluations,
  };
}

/** Bolados das minhas rodas que eu ainda não avaliei (e que não são meus) */
export async function getPendingForMe(limit = 6): Promise<Bolado[]> {
  const viewer = await requireViewer();
  if (IS_DEMO) {
    return demo.DEMO_BOLADOS.filter(
      (b) => b.roller_id !== viewer.id && !b.evaluations.some((e) => e.evaluator_id === viewer.id),
    )
      .slice(0, limit)
      .map(({ media: _m, evaluations: _e, ...b }) => b);
  }
  const sb = await supabaseServer();
  const since = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();
  const [recent, { data: mine }] = await Promise.all([
    getBolados({ from: since, limit: 40 }),
    sb.from("evaluations").select("bolado_id").eq("evaluator_id", viewer.id).gte("created_at", since),
  ]);
  const done = new Set(mine?.map((m) => m.bolado_id as string));
  return recent.filter((b) => b.roller_id !== viewer.id && !done.has(b.id)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (IS_DEMO) return demo.DEMO_PROFILES.find((p) => p.username === username) ?? null;
  const sb = await supabaseServer();
  const { data } = await sb
    .from("profiles")
    .select("id,username,display_name,avatar_path,bio,is_public,xp,level,brasas,active_theme,active_frame,active_title,streak,created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle<Profile>();
  if (!data) return null;
  const [p] = await withAvatars(sb, [data]);
  return p!;
}

export async function getProfileStats(userId: string): Promise<ProfileStats | null> {
  if (IS_DEMO) return demo.demoStats(userId);
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_profile_stats", { p_user: userId });
  if (error) return null;
  return data as ProfileStats;
}

/** Fotos e vídeos de bolados em que a pessoa foi bolador(a) */
export async function getProfileMedia(userId: string): Promise<(Media & { bolado_type: BoladoType })[]> {
  if (IS_DEMO) return [];
  const sb = await supabaseServer();
  const { data } = await sb
    .from("bolado_media")
    .select("*, bolado:bolados!inner(roller_id,type)")
    .eq("bolado.roller_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  type Row = Media & { bolado: { type: BoladoType } };
  const rows = (data as unknown as Row[]) ?? [];
  const urls = await signPaths(sb, "media", rows.map((r) => r.storage_path));
  return rows.map(({ bolado, ...m }) => ({
    ...m,
    bolado_type: bolado.type,
    signed_url: m.storage_path ? (urls.get(m.storage_path) ?? null) : null,
  }));
}

export type Consent = { id: number; kind: "terms" | "privacy" | "sensitive_data"; version: string; granted_at: string; revoked_at: string | null };

export async function getMyConsents(): Promise<Consent[]> {
  if (IS_DEMO) {
    return (["terms", "privacy", "sensitive_data"] as const).map((kind, i) => ({
      id: i,
      kind,
      version: "2026-10-19",
      granted_at: "2026-09-19T22:00:00Z",
      revoked_at: null,
    }));
  }
  const sb = await supabaseServer();
  const { data } = await sb.from("consents").select("*").order("granted_at", { ascending: false });
  return (data as Consent[]) ?? [];
}

/** Avaliações que a pessoa fez (visíveis para mim) */
export async function getEvaluationsBy(userId: string, limit = 30) {
  if (IS_DEMO) {
    return demo.DEMO_BOLADOS.flatMap((b) =>
      b.evaluations.filter((e) => e.evaluator_id === userId).map((e) => ({ ...e, bolado: { id: b.id, type: b.type, roller: b.roller } })),
    ).slice(0, limit);
  }
  const sb = await supabaseServer();
  const { data } = await sb
    .from("evaluations")
    .select(`id,total,feedback,created_at, bolado:bolados(id,type, roller:profiles!bolados_roller_id_fkey(${LITE}))`)
    .eq("evaluator_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  type Row = { id: string; total: number; feedback: string | null; created_at: string; bolado: { id: string; type: BoladoType; roller: ProfileLite } };
  return ((data as unknown as Row[]) ?? []).map((r) => ({ ...r, total: Number(r.total) }));
}

// ---------------------------------------------------------------------------
// Social e nível de habilidade
// ---------------------------------------------------------------------------
export async function getFriends(): Promise<Friend[]> {
  if (IS_DEMO) return demo.demoFriends();
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_friends");
  if (error) return [];
  type Row = Omit<Friend, "id"> & { user_id: string };
  const rows = ((data as Row[]) ?? []).map(({ user_id, ...r }) => ({ ...r, id: user_id, nota: r.nota == null ? null : Number(r.nota) }));
  return withAvatars(sb, rows);
}

export async function getSkill(userId: string): Promise<Skill | null> {
  if (IS_DEMO) return demo.demoSkill(userId);
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_skill", { p_user: userId });
  if (error || !data?.[0]) return null;
  const s = data[0] as Skill;
  return { bolados: s.bolados, nota: s.nota == null ? null : Number(s.nota) };
}

export async function getSkillPeers(): Promise<SkillPeer[]> {
  if (IS_DEMO) return demo.demoPeers();
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("get_skill_peers", { p_limit: 200 });
  if (error) return [];
  type Row = Omit<SkillPeer, "id" | "active_title"> & { user_id: string };
  const rows = ((data as Row[]) ?? []).map(({ user_id, ...r }) => ({
    ...r,
    id: user_id,
    active_title: null,
    nota: r.nota == null ? null : Number(r.nota),
  }));
  return withAvatars(sb, rows);
}

// ---------------------------------------------------------------------------
// Playbook
// ---------------------------------------------------------------------------
export async function getPlaybook(userId: string): Promise<Playbook | null> {
  if (IS_DEMO) return demo.DEMO_PLAYBOOKS[userId] ?? null;
  const sb = await supabaseServer();
  const { data } = await sb
    .from("playbooks")
    .select("*, steps:playbook_steps(id,position,title,body,media_path)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const pb = data as Playbook;
  const urls = await signPlaybook(sb, pb.steps.map((s) => s.media_path));
  return {
    ...pb,
    steps: pb.steps
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ ...s, media_url: s.media_path ? (urls.get(s.media_path) ?? null) : null })),
  };
}

async function signPlaybook(sb: ServerSupabase, paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await sb.storage.from("playbooks").createSignedUrls(unique, SIGN_TTL);
  data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  return map;
}

/** Quem, entre esses usuários, tem playbook publicado (visível para mim). */
export async function getPlaybookOwners(userIds: string[]): Promise<Set<string>> {
  if (IS_DEMO) return new Set(userIds.filter((id) => demo.DEMO_PLAYBOOKS[id]));
  if (!userIds.length) return new Set();
  const sb = await supabaseServer();
  const { data } = await sb.from("playbooks").select("user_id").in("user_id", userIds);
  return new Set((data ?? []).map((r) => r.user_id as string));
}
