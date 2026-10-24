import { Globe, Info } from "lucide-react";
import { Podium } from "@/components/ranking/podium";
import { RankingList } from "@/components/ranking/ranking-list";
import { PillTabs } from "@/components/ranking/roda-switch";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getGlobalRanking, getMyRodas, getRodaRanking, requireViewer } from "@/lib/data";
import type { BoladoType } from "@/lib/types";
import { BOLADO_TYPES, TYPE_INFO } from "@/lib/contents";

export const metadata = { title: "Ranking" };

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const sp = (await searchParams) as { roda?: string; tipo?: string };
  const [viewer, rodas] = await Promise.all([requireViewer(), getMyRodas()]);
  const scope = sp.roda === "global" ? "global" : (rodas.find((r) => r.id === sp.roda)?.id ?? rodas[0]?.id ?? "global");
  const type = BOLADO_TYPES.includes(sp.tipo as BoladoType) ? (sp.tipo as BoladoType) : undefined;

  const rows = scope === "global" ? await getGlobalRanking(type) : await getRodaRanking(scope, type);
  const ranked = rows.filter((r) => r.nota_ouro != null);
  const unranked = rows.filter((r) => r.nota_ouro == null);

  return (
    <div>
      <PageHeader eyebrow="Ranking" title="Quem manda na seda" subtitle="Ordenado pela Nota Ouro, a média que equilibra quem tem poucas e muitas avaliações." />

      <div className="mb-4">
        <PillTabs
          basePath="/ranking"
          param="roda"
          active={scope}
          extra={{ tipo: sp.tipo }}
          options={[...rodas.map((r) => ({ value: r.id, label: r.name })), { value: "global", label: "🌎 Global" }]}
        />
      </div>
      <div className="mb-8">
        <PillTabs
          basePath="/ranking"
          param="tipo"
          active={type ?? "todos"}
          extra={{ roda: scope }}
          options={[{ value: "todos", label: "Tudo" }, ...BOLADO_TYPES.map((t) => ({ value: t, label: TYPE_INFO[t].label }))]}
        />
      </div>

      {scope === "global" && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          Só aparece aqui quem deixou o perfil público nas configurações. Ninguém vê fotos ou avaliações de rodas alheias.
        </p>
      )}

      {ranked.length === 0 ? (
        <EmptyState title="Ranking vazio por enquanto">Assim que os bolados receberem avaliações, o pódio aparece aqui.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="card card-glow p-6 pt-10">
            <Podium rows={ranked} />
          </div>
          <div>
            <RankingList rows={ranked} highlightId={viewer.id} />
            {unranked.length > 0 && (
              <p className="mt-4 text-sm text-muted">
                Ainda sem nota: {unranked.map((r) => r.display_name).join(", ")}.
              </p>
            )}
          </div>
        </div>
      )}

      <details className="card mt-8 p-5 text-sm text-muted">
        <summary className="flex cursor-pointer items-center gap-2 font-medium text-fg">
          <Info className="h-4 w-4 text-accent" /> Como a Nota Ouro é calculada?
        </summary>
        <p className="mt-3 leading-relaxed">
          Cada bolado tem uma nota final (a média das notas dos avaliadores). A Nota Ouro de cada pessoa é uma média bayesiana: é
          como se todo mundo começasse com 3 bolados “fantasmas” com a nota média da roda. Assim, quem tem um único 10 não passa
          na frente de quem mantém 9 em vinte bolados. Quanto mais bolados avaliados, mais a Nota Ouro se aproxima da média real.
        </p>
      </details>
    </div>
  );
}
