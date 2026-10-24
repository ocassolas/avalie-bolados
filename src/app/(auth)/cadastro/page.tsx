import Link from "next/link";
import { SignUpForm } from "./form";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-[41px]">Criar conta</h1>
      <p className="mt-2 text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-accent hover:underline">
          Entrar
        </Link>
      </p>
      <div className="mt-8">
        <GoogleButton next="/onboarding" demo={IS_DEMO} label="Criar conta com Google" />
        <p className="mt-2 text-center text-xs text-faint">No próximo passo você confirma a idade e aceita os termos.</p>
        <OrDivider />
        <SignUpForm />
      </div>
    </>
  );
}
