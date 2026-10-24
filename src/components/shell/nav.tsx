"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  BookOpen,
  CalendarClock,
  Contact,
  HelpCircle,
  Home,
  Medal,
  Plus,
  Settings,
  ShoppingBag,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { levelProgress, levelTitle } from "@/lib/levels";
import type { Profile } from "@/lib/types";

type Item = { href: string; label: string; icon: LucideIcon; match?: string };

function useActive() {
  const path = usePathname();
  return (item: Item) => path === item.href || path.startsWith((item.match ?? item.href) + "/");
}

export function Sidebar({ profile }: { profile: Profile }) {
  const isActive = useActive();
  const main: Item[] = [
    { href: "/inicio", label: "Início", icon: Home },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/historico", label: "Histórico", icon: CalendarClock },
    { href: "/rodas", label: "Rodas", icon: Users },
    { href: "/amigos", label: "Amigos", icon: Contact },
    { href: `/perfil/${profile.username}`, label: "Meu perfil", icon: User, match: `/perfil/${profile.username}` },
  ];
  const more: Item[] = [
    { href: "/playbook", label: "Meu playbook", icon: BookOpen },
    { href: "/loja", label: "Loja", icon: ShoppingBag },
    { href: "/conquistas", label: "Conquistas", icon: Medal },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
    { href: "/como-usar", label: "Como usar", icon: HelpCircle },
  ];
  const lp = levelProgress(profile.xp);

  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-[0.5px] border-line px-3 py-6 lg:flex">
      <Link href="/inicio" className="px-2">
        <Wordmark size="sm" />
      </Link>

      <Link
        href="/bolados/novo"
        className="press mt-8 flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-semibold text-accent-fg"
      >
        <Plus className="h-5 w-5" /> Novo bolado
      </Link>

      <nav className="mt-6 space-y-1">
        {main.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </nav>
      <div className="my-5 h-px bg-line" />
      <nav className="space-y-1">
        {more.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} />
        ))}
        <SignOutButton className="w-full" />
      </nav>

      <Link href={`/perfil/${profile.username}`} className="press mt-auto flex items-center gap-3 rounded-2xl p-2.5 hover:bg-fill">
        <Avatar name={profile.display_name} src={profile.avatar_url} frame={profile.active_frame} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile.display_name}</p>
          <p className="truncate text-xs text-muted">
            Nv. {profile.level} · {levelTitle(profile.level)}
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill-strong">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, lp.pct * 100)}%` }} />
          </div>
        </div>
      </Link>
    </aside>
  );
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors duration-200",
        active ? "bg-accent/15 font-semibold text-accent" : "text-fg/85 hover:bg-fill",
      )}
    >
      <item.icon className={cn("h-[18px] w-[18px]", active ? "text-accent" : "text-muted")} strokeWidth={active ? 2.25 : 2} />
      {item.label}
    </Link>
  );
}

/** Barra de abas do iOS: cápsula de vidro flutuante e o botão "+" ao lado. */
export function BottomNav({ username }: { username: string }) {
  const isActive = useActive();
  const tabs: Item[] = [
    { href: "/inicio", label: "Início", icon: Home },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/historico", label: "Histórico", icon: CalendarClock },
    { href: `/perfil/${username}`, label: "Perfil", icon: User, match: `/perfil/${username}` },
  ];
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),14px)] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3">
        <div className="glass flex flex-1 rounded-full border-[0.5px] border-line p-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,.6)]">
          {tabs.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press relative flex h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium",
                  active ? "text-accent" : "text-fg/70",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-thumb"
                    className="absolute inset-0 rounded-full bg-fill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon className="relative h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.9} />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <Link
          href="/bolados/novo"
          aria-label="Novo bolado"
          className="press flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[0_10px_30px_-8px_rgba(0,0,0,.6)]"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}
