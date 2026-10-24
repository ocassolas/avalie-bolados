import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { IS_DEMO, SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

const PUBLIC_PREFIXES = ["/entrar", "/cadastro", "/recuperar-senha", "/auth", "/termos", "/privacidade"];
const AUTH_ONLY_GUEST = ["/entrar", "/cadastro"];

// Renova a sessão do Supabase e protege as rotas do app.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (IS_DEMO) return response;

  // Link de e-mail que caiu na Site URL (sem passar por /auth/confirm): termina o login lá.
  const sp = request.nextUrl.searchParams;
  if (request.nextUrl.pathname === "/" && (sp.has("code") || sp.has("token_hash"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    if (!sp.has("next")) url.searchParams.set("next", "/onboarding");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (user && (path === "/" || AUTH_ONLY_GUEST.some((p) => path.startsWith(p)))) {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|manifest.webmanifest|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
