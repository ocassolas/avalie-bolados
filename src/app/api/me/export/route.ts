import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

// LGPD art. 18: portabilidade. Devolve um JSON com todos os dados do titular.
export async function GET() {
  if (IS_DEMO) return NextResponse.json({ demo: true, message: "Modo demonstração: sem dados reais." });
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const { data, error } = await sb.rpc("export_my_data");
  if (error) return NextResponse.json({ error: "Não foi possível exportar agora." }, { status: 500 });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="avalie-bolados-meus-dados-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
