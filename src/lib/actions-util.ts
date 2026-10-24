import "server-only";
import { headers } from "next/headers";
import { IS_DEMO, SITE_URL } from "./env";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fields?: Record<string, string> };

export const DEMO_BLOCK: ActionResult<never> = {
  ok: false,
  error: "Modo demonstração: conecte o banco para salvar de verdade.",
};

export function demoGuard() {
  return IS_DEMO ? DEMO_BLOCK : null;
}

/** Origem da requisição (funciona em preview e produção). */
export async function origin() {
  const h = await headers();
  const o = h.get("origin");
  if (o) return o;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : SITE_URL;
}

const AUTH_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada."],
  [/user already registered/i, "Este e-mail já tem conta. Tente entrar."],
  [/password should be at least/i, "Senha fraca demais."],
  [/rate limit|too many/i, "Muitas tentativas. Espere um pouco e tente de novo."],
  [/same password|different from the old/i, "A nova senha precisa ser diferente da atual."],
  [/database error saving new user/i, "Não deu para criar a conta. Confira o nome de usuário e a data de nascimento."],
  [/duplicate key.*username/i, "Este nome de usuário já está em uso."],
  [/permission denied|row-level security/i, "Você não tem permissão para isso."],
  [/jwt|session/i, "Sua sessão expirou. Entre de novo."],
];

/** Traduz erros do Supabase. Mensagens das nossas funções SQL já vêm em português. */
export function friendlyError(err: { message?: string; code?: string } | null | undefined, fallback = "Algo deu errado. Tente de novo.") {
  const msg = err?.message ?? "";
  // P0001 = raise exception das nossas funções: a mensagem já é para o usuário
  if (err?.code === "P0001" && msg) return msg;
  for (const [re, pt] of AUTH_ERRORS) if (re.test(msg)) return pt;
  if (/[áéíóúãõç]/i.test(msg) && msg.length < 160) return msg;
  return fallback;
}
