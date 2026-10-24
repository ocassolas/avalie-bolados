export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Sem Supabase configurado, o app roda em modo demonstração: dados fictícios,
 * somente leitura. Serve para ver o app ao vivo antes de conectar o banco.
 */
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_KEY;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const CONSENT_VERSION = "2026-10-19";
