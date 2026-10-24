import Link from "next/link";
import { ArrowRight, ClipboardCheck, Plus, Users } from "lucide-react";
import { BoladoCard } from "@/components/bolado/bolado-card";
import { XpCard } from "@/components/gamification/xp-card";
import { Podium } from "@/components/ranking/podium";
import { RankingList } from "@/components/ranking/ranking-list";
import { PillTabs } from "@/components/ranking/roda-switch";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionTitle, TypeChip } from "@/components/ui/misc";
import { getBolados, getMyRodas, getPendingForMe, getRodaRanking, requireViewer } from "@/lib/data";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Início" };

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }));
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function InicioPage({ searchParams }: PageProps<"/inicio">) {
  const { roda: rodaParam } = (await searchParams) as { roda?: string };
  const [viewer, rodas] = await Promise.all([requireViewer(), getMyRodas()]);
  const first = viewer.profile.display_name.split(" ")[0];

  if (rodas.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="font-display text-[34px] font-bold leading-[41px]">
          {greeting()}, <span className="text-foil">{first}</span>.
        </h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Você ainda não está em nenhuma roda"
            action={
              <Button asChild variant="gold">
                <Link href="/rodas">Criar ou entrar numa roda</Link>
              </Button>
            }
          >
            A roda é o seu grupo. É nela que os bolados são registrados, avaliados e ranqueados. Crie a sua ou entre com o código
            de convite de um amigo.
          </EmptyState>
          <XpCard profile={viewer.profile} />
        </div>
      </div>
    );
  }

  const roda = rodas.find((r) => r.id === rodaParam) ?? rodas[0]!;
  const [ranking, recent, pending] = await Promise.all([
    getRodaRanking(roda.id),
    getBolados({ rodaId: roda.id, limit: 6 }),
    getPendingForMe(6),
  ]);
  const ranked = ranking.filter((r) => r.nota_ouro != null);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 font-display text-[34px] font-bold leading-[41px]">
            {greeting()}, <span className="text-foil">{first}</span>.
          </h1>
        </div>
        <Button asChild variant="gold" className="hidden sm:inline-flex">
          <Link href={`/bolados/novo?roda=${roda.id}`}>
            <Plus className="h-4 w-4" /> Novo bolado
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Ranking da roda */}
        <section className="card card-glow p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-accent">Ranking</p>
              <h2 className="font-display text-[22px] font-bold">{roda.name}</h2>
            </div>
            <Link href={`/ranking?roda=${roda.id}`} className="flex items-center gap-1 text-sm text-muted hover:text-accent">
              Ver completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {rodas.length > 1 && (
            <div className="mb-6">
              <PillTabs basePath="/inicio" param="roda" active={roda.id} options={rodas.map((r) => ({ value: r.id, label: r.name }))} />
            </div>
          )}
          {ranked.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Ninguém foi avaliado ainda nesta roda. Registre o primeiro bolado!</p>
          ) : (
            <>
              <div className="px-2 pt-6">
                <Podium rows={ranked} />
              </div>
              {ranked.length > 3 && (
                <div className="mt-4">
                  <RankingList rows={ranked.slice(3, 8)} start={3} highlightId={viewer.id} />
                </div>
              )}
            </>
          )}
        </section>

        <div className="space-y-6">
          <XpCard profile={viewer.profile} />
          {/* Esperando sua nota */}
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              <h2 className="font-display text-[17px] font-semibold">Esperando sua nota</h2>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted">Tudo avaliado por aqui. Boa!</p>
            ) : (
              <ul className="-mx-2 space-y-1">
                {pending.map((b) => (
                  <li key={b.id}>
                    <Link href={`/bolados/${b.id}/avaliar`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2">
                      <Avatar name={b.roller.display_name} src={b.roller.avatar_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{b.roller.display_name}</p>
                        <p className="text-xs text-muted">{relativeTime(b.rolled_at)}</p>
                      </div>
                      <TypeChip type={b.type} className="text-[10px]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section>
        <SectionTitle
          action={
            <Link href="/historico" className="flex items-center gap-1 text-sm text-muted hover:text-accent">
              Histórico <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          Últimos bolados
        </SectionTitle>
        {recent.length === 0 ? (
          <EmptyState title="Nenhum bolado ainda" action={<Button asChild variant="gold"><Link href={`/bolados/novo?roda=${roda.id}`}>Registrar o primeiro</Link></Button>}>
            Bolou? Registre com foto e chame a roda para avaliar.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((b) => (
              <BoladoCard key={b.id} bolado={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
