import Link from "next/link";
import { Users } from "lucide-react";
import { NewBoladoForm } from "./form";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getMyRodas, getRodaMembers, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Novo bolado" };

export default async function NovoBoladoPage({ searchParams }: PageProps<"/bolados/novo">) {
  const { roda } = (await searchParams) as { roda?: string };
  const [viewer, rodas] = await Promise.all([requireViewer(), getMyRodas()]);
  if (!rodas.length) {
    return (
      <EmptyState icon={<Users className="h-6 w-6" />} title="Entre numa roda primeiro" action={<Button asChild variant="gold"><Link href="/rodas">Ir para Rodas</Link></Button>}>
        Bolados são registrados dentro de uma roda, para a galera avaliar.
      </EmptyState>
    );
  }
  const members = Object.fromEntries(
    await Promise.all(rodas.map(async (r) => [r.id, (await getRodaMembers(r.id)).map((m) => m.profile)] as const)),
  );
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Novo registro" title="Registrar bolado" subtitle="Quem bolou, o quê e quando. Depois a roda avalia no checklist." />
      <NewBoladoForm
        rodas={rodas.map((r) => ({ id: r.id, name: r.name }))}
        members={members}
        viewerId={viewer.id}
        defaultRoda={rodas.some((r) => r.id === roda) ? roda! : rodas[0]!.id}
        demo={IS_DEMO}
      />
    </div>
  );
}
