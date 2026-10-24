import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-28 w-28 opacity-60 grayscale" />
      <p className="mt-6 font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Essa ponta apagou.</h1>
      <p className="mt-2 max-w-sm text-muted">A página não existe ou você não tem acesso a ela (talvez seja de outra roda).</p>
      <Button asChild variant="gold" className="mt-8">
        <Link href="/inicio">Voltar ao início</Link>
      </Button>
    </div>
  );
}
