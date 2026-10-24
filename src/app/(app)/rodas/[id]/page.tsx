import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";
import { InviteCard, MembersList, RodaDangerZone, RodaSettings } from "./client";
import { RankingList } from "@/components/ranking/ranking-list";
import { PageHeader } from "@/components/ui/misc";
import { getCriteria, getPlaybookOwners, getRoda, getRodaMembers, getRodaRanking, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export async function generateMetadata({ params }: PageProps<"/rodas/[id]">) {
  const r = await getRoda((await params).id);
  return { title: r?.name ?? "Roda" };
}

export default async function RodaPage({ params }: PageProps<"/rodas/[id]">) {
  const { id } = await params;
  const [viewer, roda] = await Promise.all([requireViewer(), getRoda(id)]);
  if (!roda) notFound();
  const [members, ranking, criteria] = await Promise.all([getRodaMembers(id), getRodaRanking(id), getCriteria()]);
  const isAdmin = roda.my_role === "owner" || roda.my_role === "admin";
  const playbookOwners = [...(await getPlaybookOwners(members.map((m) => m.profile.id)))];
  const ranked = ranking.filter((r) => r.nota_ouro != null).slice(0, 5);

  return (
    <div>
      <PageHeader eyebrow="Roda" title={roda.name} subtitle={roda.description ?? `${members.length} membros`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold">
                <Trophy className="h-5 w-5 text-accent" /> Top 5
              </h2>
              <Link href={`/ranking?roda=${id}`} className="flex items-center gap-1 text-sm text-muted hover:text-accent">
                Ranking completo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {ranked.length ? <RankingList rows={ranked} highlightId={viewer.id} /> : <p className="text-sm text-muted">Ainda sem notas.</p>}
          </section>
          <MembersList rodaId={id} members={members} viewerId={viewer.id} myRole={roda.my_role ?? "member"} demo={IS_DEMO} playbookOwners={playbookOwners} />
        </div>
        <aside className="space-y-6">
          <InviteCard rodaId={id} code={roda.invite_code} canRegenerate={isAdmin} demo={IS_DEMO} />
          {isAdmin && <RodaSettings roda={roda} criteria={criteria} demo={IS_DEMO} />}
          <RodaDangerZone rodaId={id} viewerId={viewer.id} isOwner={roda.my_role === "owner"} demo={IS_DEMO} />
        </aside>
      </div>
    </div>
  );
}
