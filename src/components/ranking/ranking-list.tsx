import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ScoreValue } from "@/components/ui/score";
import { formatScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/types";

export function RankingList({ rows, highlightId, start = 0 }: { rows: RankingRow[]; highlightId?: string; start?: number }) {
  return (
    <ol className="card divide-y divide-line overflow-hidden">
      {rows.map((r, i) => {
        const pos = start + i + 1;
        return (
          <li key={r.user_id}>
            <Link
              href={`/perfil/${r.username}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:gap-4",
                r.user_id === highlightId && "bg-accent/5",
              )}
            >
              <span className={cn("w-6 text-center font-mono text-sm tabular", pos <= 3 ? "font-bold text-accent" : "text-faint")}>{pos}</span>
              <Avatar name={r.display_name} src={r.avatar_url} frame={r.active_frame} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.display_name}
                  {r.user_id === highlightId && <span className="ml-2 text-xs text-accent">você</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {r.active_title ? `${r.active_title} · ` : ""}Nv. {r.level} · {r.bolados} bolado{r.bolados === 1 ? "" : "s"}
                  {r.best_score != null && <> · melhor {formatScore(r.best_score)}</>}
                </p>
              </div>
              <div className="text-right">
                <ScoreValue value={r.nota_ouro} digits={2} className="text-lg" />
                <p className="text-[11px] text-faint">média {formatScore(r.avg_score)}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
