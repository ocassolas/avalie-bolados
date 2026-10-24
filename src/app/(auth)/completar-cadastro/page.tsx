import { redirect } from "next/navigation";
import { CompleteForm } from "./form";
import { getViewer } from "@/lib/data";

export const metadata = { title: "Completar cadastro" };

// Contas criadas pelo Google chegam aqui sem data de nascimento nem aceites.
export default async function CompletarCadastroPage({ searchParams }: PageProps<"/completar-cadastro">) {
  const { next } = (await searchParams) as { next?: string };
  const viewer = await getViewer();
  if (!viewer) redirect("/entrar");
  if (viewer.profile.birthdate) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio");
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-[41px]">Falta pouco</h1>
      <p className="mt-2 text-muted">
        Você entrou com o Google como <strong className="text-fg">{viewer.email}</strong>. Antes de começar, confirma sua idade e
        escolhe seu @.
      </p>
      <div className="mt-8">
        <CompleteForm initialName={viewer.profile.display_name} initialUsername={viewer.profile.username} />
      </div>
    </>
  );
}
