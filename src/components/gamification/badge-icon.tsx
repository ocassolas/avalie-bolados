import { BookOpen, Camera, ChefHat, Crown, Flame, FlaskConical, Leaf, Lock, Scale, Sprout, Star, Users, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  star: Star,
  scale: Scale,
  chef: ChefHat,
  flame: Flame,
  leaf: Leaf,
  sprout: Sprout,
  camera: Camera,
  video: Video,
  crown: Crown,
  flask: FlaskConical,
  book: BookOpen,
};

const RARITY = {
  comum: "from-zinc-300/30 to-zinc-500/10 text-zinc-200 ring-zinc-400/30",
  rara: "from-sky-300/30 to-sky-600/10 text-sky-200 ring-sky-400/40",
  epica: "from-fuchsia-300/30 to-purple-700/10 text-fuchsia-200 ring-fuchsia-400/40",
  lendaria: "from-[var(--accent-2)]/40 to-[var(--accent-3)]/20 text-accent-2 ring-accent/60",
};

export const RARITY_LABEL = { comum: "Comum", rara: "Rara", epica: "Épica", lendaria: "Lendária" } as const;

function ConeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h8l-3 16h-2z" />
      <path d="M12 2c1 1 .5 2 0 2.5" />
    </svg>
  );
}

export function BadgeIcon({ badge, owned, size = "md" }: { badge: Badge; owned: boolean; size?: "sm" | "md" | "lg" }) {
  const Icon = ICONS[badge.icon];
  const box = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" }[size];
  const ico = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-9 w-9" }[size];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
        box,
        owned ? RARITY[badge.rarity] : "from-surface-2 to-surface text-faint ring-line grayscale",
      )}
    >
      {Icon ? <Icon className={ico} /> : <ConeIcon className={ico} />}
      {!owned && <Lock className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-bg p-0.5 text-faint" />}
    </div>
  );
}
