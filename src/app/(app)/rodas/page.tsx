import Link from "next/link";
import { ChevronRight, Crown, Shield, Users } from "lucide-react";
import { RodaForms } from "./forms";
import { PageHeader } from "@/components/ui/misc";
import { getMyRodas, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Rodas" };

export default async function RodasPage({ searchParams }: PageProps<"/rodas">) {
  const { convite } = (await searchParams) as { convite?: string };
  await requireViewer();
  const rodas = await getMyRodas();
  return (
    <div>
      <PageHeader eyebrow="Rodas" title="Suas rodas" subtitle="Cada roda tem seu próprio ranking, histórico e regras de peso." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          {rodas.length === 0 ? (
            <div className="card p-8 text-center text-muted">
              <Users className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-3">Você ainda não está em nenhuma roda. Crie uma ou entre com um código.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rodas.map((r) => (
                <li key={r.id}>
                  <Link href={`/rodas/${r.id}`} className="card flex items-center gap-4 p-5 transition hover:border-line-strong">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foil font-display text-xl font-bold text-accent-fg">
                      {r.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-semibold">
                        {r.name}
                        {r.my_role === "owner" && <Crown className="h-4 w-4 text-accent" aria-label="Dono" />}
                        {r.my_role === "admin" && <Shield className="h-4 w-4 text-accent" aria-label="Admin" />}
                      </p>
                      <p className="truncate text-sm text-muted">{r.description ?? `${r.members_count} membros`}</p>
                    </div>
                    <span className="text-sm text-faint">{r.members_count} 👥</span>
                    <ChevronRight className="h-5 w-5 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <RodaForms demo={IS_DEMO} initialCode={convite} />
      </div>
    </div>
  );
}
