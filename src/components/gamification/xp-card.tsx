import Link from "next/link";
import { CalendarCheck, Flame, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { levelProgress, levelTitle } from "@/lib/levels";
import type { Profile } from "@/lib/types";

export function XpCard({ profile }: { profile: Profile }) {
  const lp = levelProgress(profile.xp);
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="relative flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} frame={profile.active_frame} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-accent">Nível {profile.level}</p>
          <p className="truncate font-display text-[22px] font-bold">{levelTitle(profile.level)}</p>
          {profile.active_title && <p className="truncate text-xs text-muted">“{profile.active_title}”</p>}
        </div>
      </div>
      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span className="font-mono tabular">
            {lp.current} / {lp.needed} XP
          </span>
          <span>faltam {lp.needed - lp.current} para o nível {lp.level + 1}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-fill-strong">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700 [transition-timing-function:var(--ease-ios)]" style={{ width: `${Math.min(100, lp.pct * 100)}%` }} />
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
        <Link href="/loja" className="press rounded-xl bg-fill p-2.5">
          <Flame className="mx-auto h-4 w-4 text-ember" />
          <p className="mt-1 font-mono text-base font-semibold tabular">{profile.brasas}</p>
          <p className="text-[11px] text-faint">Brasas</p>
        </Link>
        <div className="rounded-xl bg-fill p-2.5">
          <Zap className="mx-auto h-4 w-4 text-accent" />
          <p className="mt-1 font-mono text-base font-semibold tabular">{profile.xp}</p>
          <p className="text-[11px] text-faint">XP total</p>
        </div>
        <div className="rounded-xl bg-fill p-2.5">
          <CalendarCheck className="mx-auto h-4 w-4 text-success" />
          <p className="mt-1 font-mono text-base font-semibold tabular">{profile.streak}</p>
          <p className="text-[11px] text-faint">Dias seguidos</p>
        </div>
      </div>
    </div>
  );
}
