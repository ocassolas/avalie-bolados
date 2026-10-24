import Link from "next/link";
import { Eye } from "lucide-react";
import { PlaybookEditor } from "./editor";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { getPlaybook, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Meu playbook" };

export default async function PlaybookPage() {
  const viewer = await requireViewer();
  const playbook = await getPlaybook(viewer.id);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Playbook"
        title="Meu jeito de bolar"
        subtitle="Opcional. Ensine a roda o seu método, passo a passo. Aparece no seu perfil para quem é da roda e para os amigos."
        action={
          playbook ? (
            <Button asChild variant="solid" size="sm">
              <Link href={`/perfil/${viewer.profile.username}?aba=playbook`}>
                <Eye className="h-4 w-4" /> Ver como fica
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PlaybookEditor userId={viewer.id} initial={playbook} demo={IS_DEMO} />
    </div>
  );
}
