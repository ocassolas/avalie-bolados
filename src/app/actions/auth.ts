"use server";

import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { demoGuard, friendlyError, origin, type ActionResult } from "@/lib/actions-util";
import { completeProfileSchema, fieldErrors, firstError, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation";

export async function signUp(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const v = parsed.data;

  const sb = await supabaseServer();
  const { data: available } = await sb.rpc("username_available", { p_username: v.username });
  if (!available) return { ok: false, error: "Este nome de usuário já está em uso.", fields: { username: "Já está em uso." } };

  const { data, error } = await sb.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      emailRedirectTo: `${await origin()}/auth/confirm?next=/onboarding`,
      data: {
        username: v.username,
        display_name: v.display_name,
        birthdate: v.birthdate,
        consent_terms: true,
        consent_privacy: true,
        consent_sensitive_data: true,
        consent_version: CONSENT_VERSION,
      },
    },
  });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, data: { needsConfirmation: !data.session } };
}

export async function signIn(input: unknown, next?: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: friendlyError(error) };
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio");
}

export async function signOut() {
  if (demoGuard()) redirect("/");
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = signInSchema.shape.email.safeParse(email);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const sb = await supabaseServer();
  await sb.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await origin()}/auth/confirm?next=/redefinir-senha` });
  // Mesma resposta exista ou não a conta (não revela e-mails cadastrados)
  return { ok: true, message: "Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha." };
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Senha atualizada." };
}

export async function updateEmail(email: string): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = signInSchema.shape.email.safeParse(email);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ email: parsed.data }, { emailRedirectTo: `${await origin()}/auth/confirm?next=/configuracoes` });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Enviamos um link de confirmação para o novo e-mail." };
}

/** Contas do Google: data de nascimento, @ e aceites da LGPD (RPC complete_profile). */
export async function completeProfile(input: unknown): Promise<ActionResult> {
  const blocked = demoGuard();
  if (blocked) return blocked;
  const parsed = completeProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), fields: fieldErrors(parsed.error) };
  const sb = await supabaseServer();
  const v = parsed.data;
  const { error } = await sb.rpc("complete_profile", {
    p_birthdate: v.birthdate,
    p_username: v.username,
    p_display_name: v.display_name,
    p_version: CONSENT_VERSION,
  });
  if (error) {
    const msg = friendlyError(error);
    return { ok: false, error: msg, fields: /usuário/i.test(msg) ? { username: msg } : /idade|18 anos|nascimento/i.test(msg) ? { birthdate: msg } : undefined };
  }
  return { ok: true };
}
