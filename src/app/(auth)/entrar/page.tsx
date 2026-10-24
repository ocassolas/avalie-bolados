import Link from "next/link";
import { SignInForm } from "./form";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next, erro } = (await searchParams) as { next?: string; erro?: string };
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-[41px]">Bem-vindo de volta</h1>
      <p className="mt-2 text-muted">
        Novo por aqui?{" "}
        <Link href="/cadastro" className="font-medium text-accent hover:underline">
          Criar conta
        </Link>
      </p>
      {erro && (
        <p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {erro === "link" ? "O link expirou ou já foi usado. Entre ou peça um novo." : erro === "google" ? "O login com Google não foi concluído. Tente de novo." : "Não foi possível entrar. Tente de novo."}
        </p>
      )}
      <div className="mt-8">
        <GoogleButton next={next} demo={IS_DEMO} />
        <OrDivider />
        <SignInForm next={next} />
      </div>
    </>
  );
}
