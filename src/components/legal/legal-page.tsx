import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/">
        <Wordmark size="sm" />
      </Link>
      <h1 className="mt-10 font-display text-[34px] font-bold leading-[41px]">{title}</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: {updated}</p>
      <article className="mt-8 space-y-6 leading-relaxed text-fg/85 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2 [&_strong]:text-fg">
        {children}
      </article>
      <p className="mt-12 border-t border-line pt-6 text-sm text-faint">
        <Link href="/termos" className="hover:text-fg">Termos de Uso</Link> · <Link href="/privacidade" className="hover:text-fg">Política de Privacidade</Link>
      </p>
    </div>
  );
}
