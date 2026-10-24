import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

// Recebe os links de e-mail do Supabase (confirmação de conta, nova senha, troca de e-mail).
// Aceita os dois formatos: token_hash (template customizado) e code (PKCE padrão).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/inicio";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/inicio";

  // Cancelou na tela do Google (ou o provedor recusou)
  if (url.searchParams.get("error")) {
    const dest = url.clone();
    dest.search = "";
    dest.pathname = "/entrar";
    dest.searchParams.set("erro", "google");
    return NextResponse.redirect(dest);
  }

  const sb = await supabaseServer();
  let ok = false;
  if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const dest = url.clone();
  dest.search = "";
  if (ok) {
    dest.pathname = type === "recovery" ? "/redefinir-senha" : next;
  } else {
    dest.pathname = "/entrar";
    dest.searchParams.set("erro", "link");
  }
  return NextResponse.redirect(dest);
}
