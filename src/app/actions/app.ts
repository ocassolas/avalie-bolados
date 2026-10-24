"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { demoGuard, friendlyError, type ActionResult } from "@/lib/actions-util";
import {
  boladoSchema,
  evaluationSchema,
  fieldErrors,
  firstError,
  mediaLinkSchema,
  profileSchema,
  rodaSchema,
} from "@/lib/validation";
import type { CriterionKey, ShopKind } from "@/lib/types";
import { deriveType } from "@/lib/contents";

async function authed() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}

const NOT_LOGGED: ActionResult<never> = { ok: false, error: "Sua sessão expirou. Entre de novo." };

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { error } = await sb
    .from("profiles")
    .update({ display_name: parsed.data.display_name, username: parsed.data.username, bio: parsed.data.bio || null })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Este nome de usuário já está em uso.", fields: { username: "Já está em uso." } };
    return { ok: false, error: friendlyError(error) };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil atualizado." };
}

export async function setAvatarPath(path: string | null): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  if (path && !path.startsWith(`${user.id}/`)) return { ok: false, error: "Caminho inválido." };
  const { data: old } = await sb.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await sb.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (old?.avatar_path && old.avatar_path !== path) await sb.storage.from("avatars").remove([old.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Foto atualizada." };
}

export async function updatePrivacy(isPublic: boolean): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { error } = await sb.from("profiles").update({ is_public: isPublic }).eq("id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: isPublic ? "Seu perfil agora é público." : "Seu perfil agora é visível só para suas rodas." };
}

// ---------------------------------------------------------------------------
// Rodas
// ---------------------------------------------------------------------------
export async function createRoda(input: unknown): Promise<ActionResult<{ id: string }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = rodaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data, error } = await sb
    .from("rodas")
    .insert({ name: parsed.data.name, description: parsed.data.description || null, owner_id: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function joinRoda(code: string): Promise<ActionResult<{ id: string }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(clean)) return { ok: false, error: "Código de convite inválido." };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data, error } = await sb.rpc("join_roda", { p_code: clean });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data as string } };
}

export async function updateRoda(id: string, input: unknown, weights?: Partial<Record<CriterionKey, number>> | null): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = rodaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const patch: Record<string, unknown> = { name: parsed.data.name, description: parsed.data.description || null };
  if (weights !== undefined) patch.weights = weights && Object.keys(weights).length ? weights : null;
  const { error, count } = await sb.from("rodas").update(patch, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (!count) return { ok: false, error: "Só donos e admins editam a roda." };
  revalidatePath(`/rodas/${id}`);
  return { ok: true, message: "Roda atualizada." };
}

export async function regenerateInvite(id: string): Promise<ActionResult<{ code: string }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { data, error } = await sb.rpc("regenerate_invite", { p_roda: id });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/rodas/${id}`);
  return { ok: true, data: { code: data as string } };
}

export async function setMemberRole(rodaId: string, userId: string, role: "owner" | "admin" | "member"): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error } = await sb.rpc("set_member_role", { p_roda: rodaId, p_user: userId, p_role: role });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/rodas/${rodaId}`);
  return { ok: true, message: role === "owner" ? "Roda transferida." : "Função atualizada." };
}

export async function removeMember(rodaId: string, userId: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error } = await sb.rpc("remove_member", { p_roda: rodaId, p_user: userId });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRoda(id: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error, count } = await sb.from("rodas").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (!count) return { ok: false, error: "Só quem é dono pode apagar a roda." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Roda apagada." };
}

// ---------------------------------------------------------------------------
// Bolados e mídia
// ---------------------------------------------------------------------------
export async function createBolado(input: unknown): Promise<ActionResult<{ id: string }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = boladoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const v = parsed.data;
  const rolledAt = new Date(v.rolled_at);
  if (Number.isNaN(rolledAt.getTime()) || rolledAt.getTime() > Date.now() + 5 * 60_000) {
    return { ok: false, error: "Data e hora inválidas.", fields: { rolled_at: "Não pode ser no futuro." } };
  }
  const { data, error } = await sb
    .from("bolados")
    .insert({
      roda_id: v.roda_id,
      roller_id: v.roller_id,
      created_by: user.id,
      // O banco também deriva o tipo a partir do conteúdo (trigger set_bolado_type)
      type: deriveType(v.contents)!,
      contents: v.contents,
      mix_tobacco_pct: deriveType(v.contents) === "mesclado" ? (v.mix_tobacco_pct ?? null) : null,
      weight_g: v.weight_g ?? null,
      rolled_at: rolledAt.toISOString(),
      paper: v.paper || null,
      paper_size: v.paper_size || null,
      filter: v.filter || null,
      notes: v.notes || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function deleteBolado(id: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { data: media } = await sb.from("bolado_media").select("storage_path").eq("bolado_id", id);
  const { error, count } = await sb.from("bolados").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (!count) return { ok: false, error: "Você não pode apagar este bolado." };
  const paths = (media ?? []).map((m) => m.storage_path).filter(Boolean) as string[];
  if (paths.length) await sb.storage.from("media").remove(paths);
  revalidatePath("/", "layout");
  return { ok: true, message: "Bolado apagado." };
}

/** Registra no banco um arquivo que o navegador já subiu para o Storage. */
export async function registerMedia(input: { bolado_id: string; roda_id: string; kind: "photo" | "video"; storage_path: string; caption?: string }): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  if (!input.storage_path.startsWith(`${input.roda_id}/${input.bolado_id}/`)) return { ok: false, error: "Caminho inválido." };
  const { error } = await sb.from("bolado_media").insert({
    bolado_id: input.bolado_id,
    roda_id: input.roda_id,
    uploader_id: user.id,
    kind: input.kind,
    storage_path: input.storage_path,
    caption: input.caption?.slice(0, 140) || null,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/bolados/${input.bolado_id}`);
  return { ok: true };
}

export async function addMediaLink(input: unknown): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = mediaLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data: b } = await sb.from("bolados").select("roda_id").eq("id", parsed.data.bolado_id).single();
  if (!b) return { ok: false, error: "Bolado não encontrado." };
  const { error } = await sb.from("bolado_media").insert({
    bolado_id: parsed.data.bolado_id,
    roda_id: b.roda_id,
    uploader_id: user.id,
    kind: "link",
    url: parsed.data.url,
    caption: parsed.data.caption || null,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/bolados/${parsed.data.bolado_id}`);
  return { ok: true, message: "Vídeo adicionado." };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { data: m } = await sb.from("bolado_media").select("storage_path,bolado_id").eq("id", id).single();
  const { error, count } = await sb.from("bolado_media").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (!count) return { ok: false, error: "Você não pode apagar esta mídia." };
  if (m?.storage_path) await sb.storage.from("media").remove([m.storage_path]);
  if (m) revalidatePath(`/bolados/${m.bolado_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Avaliações
// ---------------------------------------------------------------------------
export async function submitEvaluation(input: unknown): Promise<ActionResult<{ total: number; final_score: number }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = evaluationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const v = parsed.data;
  const { data, error } = await sb.rpc("submit_evaluation", {
    p_bolado: v.bolado_id,
    p_scores: v.scores,
    p_feedback: v.feedback ?? null,
    p_airflow: v.airflow,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  const d = data as { total: number; final_score: number };
  return { ok: true, data: { total: Number(d.total), final_score: Number(d.final_score) } };
}

export async function deleteEvaluation(id: string, boladoId: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error } = await sb.from("evaluations").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/bolados/${boladoId}`);
  return { ok: true, message: "Avaliação removida." };
}

// ---------------------------------------------------------------------------
// Loja
// ---------------------------------------------------------------------------
export async function purchaseItem(key: string): Promise<ActionResult<{ brasas: number }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { data, error } = await sb.rpc("purchase_item", { p_key: key });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, data: data as { brasas: number }, message: "Comprado! Já pode equipar." };
}

export async function equipItem(kind: ShopKind, key: string | null): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error } = await sb.rpc("equip_item", { p_kind: kind, p_key: key });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: key ? "Equipado." : "Removido." };
}

// ---------------------------------------------------------------------------
// LGPD
// ---------------------------------------------------------------------------
export async function revokeConsent(kind: "sensitive_data" | "privacy" | "terms"): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb } = await authed();
  const { error } = await sb.rpc("revoke_consent", { p_kind: kind });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/configuracoes");
  return { ok: true };
}

/** Apaga arquivos do Storage que eu enviei e depois a conta (via RPC). */
export async function deleteMyAccount(confirmation: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") return { ok: false, error: 'Digite EXCLUIR para confirmar.' };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;

  const { data: media } = await sb.from("bolado_media").select("storage_path").eq("uploader_id", user.id);
  const mediaPaths = (media ?? []).map((m) => m.storage_path).filter(Boolean) as string[];
  if (mediaPaths.length) await sb.storage.from("media").remove(mediaPaths);
  const { data: pbFiles } = await sb.storage.from("playbooks").list(user.id);
  if (pbFiles?.length) await sb.storage.from("playbooks").remove(pbFiles.map((f) => `${user.id}/${f.name}`));
  const { data: avatars } = await sb.storage.from("avatars").list(user.id);
  if (avatars?.length) await sb.storage.from("avatars").remove(avatars.map((f) => `${user.id}/${f.name}`));

  const { error } = await sb.rpc("delete_my_account");
  if (error) return { ok: false, error: friendlyError(error) };
  await sb.auth.signOut();
  return { ok: true };
}
