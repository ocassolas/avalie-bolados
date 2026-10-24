import Link from "next/link";
import { Ellipsis, Flame } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import type { Profile } from "@/lib/types";
import { MobileMenu } from "./mobile-menu";

/** Barra de navegação do iOS (celular): translúcida, marca, Brasas e menu "Mais". */
export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="glass sticky top-0 z-30 border-b-[0.5px] border-line pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/inicio" className="press flex items-center gap-2" aria-label="Início">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[17px] font-semibold">
            Avalie <span className="text-accent">Bolados</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/loja" className="press flex h-8 items-center gap-1 rounded-full bg-fill px-3 font-mono text-[15px] font-semibold">
            <Flame className="h-4 w-4 text-ember" />
            {profile.brasas}
          </Link>
          <MobileMenu trigger={<Ellipsis className="h-5 w-5" />} />
        </div>
      </div>
    </header>
  );
}

export function DemoBanner() {
  return (
    <div className="relative z-20 bg-accent/12 px-4 py-2 text-center text-[13px] text-accent">
      <strong className="font-semibold">Modo demonstração</strong> · dados fictícios para você ver o app. As ações ficam
      desligadas até o banco ser conectado.
    </div>
  );
}
