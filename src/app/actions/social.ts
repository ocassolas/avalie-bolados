"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { demoGuard, friendlyError, type ActionResult } from "@/lib/actions-util";
import { firstError } from "@/lib/validation";
import type { UserSearchResult } from "@/lib/types";

async function authed() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}

const NOT_LOGGED: ActionResult<never> = { ok: false, error: "Sua sessão expirou. Entre de novo." };

// ---------------------------------------------------------------------------
// Amizades
// ---------------------------------------------------------------------------
const MESSAGES: Record<string, string> = {
  sent: "Pedido enviado.",
  pending: "Você já mandou um pedido. Agora é com a outra pessoa.",
  accepted: "Vocês agora são amigos!",
  already: "Vocês já são amigos.",
};

export async function sendFriendRequest(username: string): Promise<ActionResult<{ status: string }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data, error } = await sb.rpc("send_friend_request", { p_username: username.replace(/^@/, "") });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  const status = data as string;
  return { ok: true, data: { status }, message: MESSAGES[status] };
}

export async function respondFriendRequest(id: string, accept: boolean): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { error } = await sb.rpc("respond_friend_request", { p_id: id, p_accept: accept });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: accept ? "Amizade aceita!" : "Pedido recusado." };
}

export async function removeFriend(userId: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { error } = await sb.rpc("remove_friend", { p_other: userId });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function searchUsers(query: string): Promise<ActionResult<UserSearchResult[]>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data, error } = await sb.rpc("search_users", { p_query: query.replace(/^@/, "") });
  if (error) return { ok: false, error: friendlyError(error) };
  const rows = (data as UserSearchResult[]) ?? [];
  // Foto só de quem eu já posso ver (a política do Storage decide)
  const paths = rows.map((r) => r.avatar_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await sb.storage.from("avatars").createSignedUrls(paths, 3600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  return { ok: true, data: rows.map((r) => ({ ...r, avatar_url: r.avatar_path ? (urls.get(r.avatar_path) ?? null) : null })) };
}

// ---------------------------------------------------------------------------
// Playbook
// ---------------------------------------------------------------------------
const text = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

const playbookSchema = z.object({
  style: text(40),
  intro: text(500),
  tips: text(1000),
  favorite_paper: text(60),
  favorite_filter: text(60),
  favorite_size: text(30),
  time_minutes: z.number().int().min(1).max(120).nullable().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Todo passo precisa de um título.").max(80),
        body: text(600),
        media_path: z.string().max(200).nullable().optional(),
      }),
    )
    .min(1, "Adicione pelo menos um passo.")
    .max(20, "Até 20 passos."),
});

export async function savePlaybook(input: unknown): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = playbookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { steps, ...pb } = parsed.data;
  if (steps.some((s) => s.media_path && !s.media_path.startsWith(`${user.id}/`))) return { ok: false, error: "Foto inválida." };

  const { data: old } = await sb.from("playbook_steps").select("media_path").eq("user_id", user.id);

  const { error: upErr } = await sb.from("playbooks").upsert({ user_id: user.id, ...pb, time_minutes: pb.time_minutes ?? null });
  if (upErr) return { ok: false, error: friendlyError(upErr) };
  // Passos são regravados na ordem da tela
  const { error: delErr } = await sb.from("playbook_steps").delete().eq("user_id", user.id);
  if (delErr) return { ok: false, error: friendlyError(delErr) };
  const { error: insErr } = await sb.from("playbook_steps").insert(
    steps.map((s, i) => ({ user_id: user.id, position: i + 1, title: s.title, body: s.body, media_path: s.media_path ?? null })),
  );
  if (insErr) return { ok: false, error: friendlyError(insErr) };

  // Fotos que saíram do playbook vão embora do Storage
  const keep = new Set(steps.map((s) => s.media_path).filter(Boolean));
  const orphan = (old ?? []).map((o) => o.media_path as string | null).filter((p): p is string => !!p && !keep.has(p));
  if (orphan.length) await sb.storage.from("playbooks").remove(orphan);

  revalidatePath("/", "layout");
  return { ok: true, message: "Playbook salvo!" };
}

export async function deletePlaybook(): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const { sb, user } = await authed();
  if (!user) return NOT_LOGGED;
  const { data: files } = await sb.storage.from("playbooks").list(user.id);
  if (files?.length) await sb.storage.from("playbooks").remove(files.map((f) => `${user.id}/${f.name}`));
  const { error } = await sb.from("playbooks").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Playbook apagado." };
}
