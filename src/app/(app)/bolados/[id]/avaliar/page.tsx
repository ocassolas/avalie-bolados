import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { EvaluationWizard } from "@/components/evaluation/wizard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getBolado, getCriteria, getRoda, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";
import type { CriterionKey } from "@/lib/types";
import { withinHours } from "@/lib/utils";

export const metadata = { title: "Avaliar" };

export default async function AvaliarPage({ params }: PageProps<"/bolados/[id]/avaliar">) {
  const { id } = await params;
  const [viewer, bolado, criteria] = await Promise.all([requireViewer(), getBolado(id), getCriteria()]);
  if (!bolado) notFound();
  const roda = await getRoda(bolado.roda_id);

  if (bolado.roller_id === viewer.id && !IS_DEMO) {
    return (
      <EmptyState icon={<Lock className="h-6 w-6" />} title="Esse bolado é seu" action={<Button asChild variant="outline"><Link href={`/bolados/${id}`}>Voltar</Link></Button>}>
        Ninguém avalia o próprio bolado. Chame a roda para dar as notas.
      </EmptyState>
    );
  }

  // No modo demonstração a avaliação fica sempre liberada, para quem está conhecendo o app
  const mine = IS_DEMO ? undefined : bolado.evaluations.find((e) => e.evaluator_id === viewer.id);
  if (mine && !withinHours(mine.created_at, 24)) {
    return (
      <EmptyState icon={<Lock className="h-6 w-6" />} title="Avaliação fechada" action={<Button asChild variant="outline"><Link href={`/bolados/${id}`}>Ver o bolado</Link></Button>}>
        Avaliações só podem ser editadas nas primeiras 24 horas.
      </EmptyState>
    );
  }

  const initial = mine
    ? {
        scores: Object.fromEntries(mine.scores.map((s) => [s.criterion_key, s.score])) as Partial<Record<CriterionKey, number>>,
        checks: Object.fromEntries(mine.scores.map((s) => [s.criterion_key, s.checklist])) as Partial<Record<CriterionKey, string[]>>,
        skipBolar: !mine.scores.some((s) => s.criterion_key === "bolar"),
        airflow: mine.airflow,
        feedback: mine.feedback ?? "",
      }
    : undefined;

  return (
    <EvaluationWizard
      boladoId={bolado.id}
      roller={bolado.roller}
      type={bolado.type}
      rolledAt={bolado.rolled_at}
      criteria={criteria}
      weights={roda?.weights}
      initial={initial}
      demo={IS_DEMO}
    />
  );
}
