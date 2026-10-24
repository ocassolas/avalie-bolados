import Link from "next/link";
import { Camera, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConeArt, TypeChip } from "@/components/ui/misc";
import { ScoreValue, TierLabel } from "@/components/ui/score";
import { cn, formatDateTime } from "@/lib/utils";
import type { Bolado } from "@/lib/types";
import { contentsSummary } from "@/lib/contents";

export function BoladoCard({ bolado, className, showRoda = false }: { bolado: Bolado; className?: string; showRoda?: boolean }) {
  return (
    <Link
      href={`/bolados/${bolado.id}`}
      className={cn("card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-line-strong", className)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {bolado.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bolado.cover_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <ConeArt type={bolado.type} className="h-full w-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        <TypeChip type={bolado.type} className="absolute left-3 top-3 bg-bg/70 backdrop-blur" />
        <div className="absolute bottom-3 right-3 rounded-xl bg-bg/80 px-2.5 py-1 backdrop-blur">
          <ScoreValue value={bolado.final_score} digits={1} className="text-lg" />
        </div>
      </div>
      <div className="flex items-center gap-3 p-4">
        <Avatar name={bolado.roller.display_name} src={bolado.roller.avatar_url} frame={bolado.roller.active_frame} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{bolado.roller.display_name}</p>
          {contentsSummary(bolado.contents) && <p className="truncate text-xs text-fg/75">{contentsSummary(bolado.contents)}</p>}
          <p className="truncate text-xs text-muted">
            {formatDateTime(bolado.rolled_at)}
            {showRoda && bolado.roda_name ? ` · ${bolado.roda_name}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-faint">
          <TierLabel value={bolado.final_score} className="text-[10px]" />
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{bolado.evaluations_count}</span>
            {!!bolado.media_count && <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" />{bolado.media_count}</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Linha compacta para listas (histórico, perfil). */
export function BoladoRow({ bolado }: { bolado: Bolado }) {
  return (
    <Link href={`/bolados/${bolado.id}`} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-surface-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        {bolado.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bolado.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ConeArt type={bolado.type} className="h-full w-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium">
          {bolado.roller.display_name} <TypeChip type={bolado.type} className="px-2 text-[10px]" />
        </p>
        <p className="truncate text-xs text-muted">
          {contentsSummary(bolado.contents, 2) ? `${contentsSummary(bolado.contents, 2)} · ` : ""}{formatDateTime(bolado.rolled_at)} · {bolado.evaluations_count} avaliaç{bolado.evaluations_count === 1 ? "ão" : "ões"}
          {bolado.roda_name ? ` · ${bolado.roda_name}` : ""}
        </p>
      </div>
      <ScoreValue value={bolado.final_score} className="text-lg" />
    </Link>
  );
}
