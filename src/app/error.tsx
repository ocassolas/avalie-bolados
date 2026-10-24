"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative z-10 flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-ember">erro</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Deu ruim na queima.</h1>
      <p className="mt-2 max-w-sm text-muted">Algo falhou do nosso lado. Tente de novo; se continuar, recarregue a página.</p>
      <Button variant="gold" className="mt-8" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
