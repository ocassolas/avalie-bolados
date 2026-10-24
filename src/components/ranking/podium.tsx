import Link from "next/link";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScoreValue } from "@/components/ui/score";
import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/types";

const PLACES = [
  { pos: 2, h: "h-24", ring: "from-zinc-200 to-zinc-500", label: "2º", order: "order-1" },
  { pos: 1, h: "h-32", ring: "from-[var(--accent-2)] to-[var(--accent-3)]", label: "1º", order: "order-2" },
  { pos: 3, h: "h-20", ring: "from-amber-600 to-amber-900", label: "3º", order: "order-3" },
];

/** Pódio dos 3 primeiros com foto e nota final ("Nota Ouro"). */
export function Podium({ rows }: { rows: RankingRow[] }) {
  const ranked = rows.filter((r) => r.nota_ouro != null);
  if (ranked.length === 0) return null;
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {PLACES.map(({ pos, h, ring, label, order }) => {
        const r = ranked[pos - 1];
        if (!r) return <div key={pos} className={order} />;
        return (
          <Link key={pos} href={`/perfil/${r.username}`} className={cn("group flex flex-col items-center", order)}>
            <div className="relative mb-3">
              {pos === 1 && <Crown className="absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 text-accent" />}
              <div className={cn("rounded-full bg-gradient-to-b p-[3px]", ring)}>
                <Avatar name={r.display_name} src={r.avatar_url} size={pos === 1 ? "xl" : "lg"} className="ring-2 ring-bg" />
              </div>
            </div>
            <p className="max-w-full truncate text-sm font-semibold group-hover:text-accent">{r.display_name}</p>
            <p className="mb-2 text-[11px] text-muted">
              {r.bolados} bolado{r.bolados === 1 ? "" : "s"}
            </p>
            <div
              className={cn(
                "flex w-full flex-col items-center justify-start rounded-t-2xl border border-b-0 border-line pt-3",
                h,
                pos === 1 ? "bg-gradient-to-b from-accent/20 to-transparent" : "bg-gradient-to-b from-surface-2 to-transparent",
              )}
            >
              <ScoreValue value={r.nota_ouro} digits={2} className={pos === 1 ? "text-2xl" : "text-lg"} />
              <span className="mt-0.5 font-display text-sm text-faint">{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
