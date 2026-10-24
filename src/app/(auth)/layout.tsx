import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { DemoBanner } from "@/components/shell/topbar";
import { IS_DEMO } from "@/lib/env";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative z-10 grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-bg-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="relative">
          <Wordmark size="sm" />
        </Link>
        <div className="relative mx-auto flex h-[min(40vh,320px)] w-[min(40vh,320px)] items-center justify-center rounded-[22.5%] bg-surface p-[12%] shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)]">
          <LogoMark animated className="h-full w-full" />
        </div>
        <blockquote className="relative">
          <p className="font-display text-[34px] font-bold leading-[41px]">
            Bolado bom não se discute. <span className="text-accent">Se avalia.</span>
          </p>
          <p className="mt-2 text-[15px] text-muted">Checklist oficial · pré-crema e pós-crema</p>
        </blockquote>
      </div>
      <div className="flex flex-col">
        {IS_DEMO && <DemoBanner />}
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link href="/">
            <Wordmark size="sm" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md animate-rise">{children}</div>
        </div>
      </div>
    </div>
  );
}
