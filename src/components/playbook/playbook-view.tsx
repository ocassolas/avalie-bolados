import { Clock, Lightbulb, Ruler, ScrollText, Wind } from "lucide-react";
import type { Playbook } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

/** O tutorial de como a pessoa bola, passo a passo. */
export function PlaybookView({ playbook, name }: { playbook: Playbook; name: string }) {
  const materials = [
    { icon: ScrollText, label: "Seda", value: playbook.favorite_paper },
    { icon: Ruler, label: "Tamanho", value: playbook.favorite_size },
    { icon: Wind, label: "Piteira", value: playbook.favorite_filter },
  ].filter((m) => m.value);

  return (
    <article className="space-y-5">
      <header className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          {playbook.style && <span className="rounded-full bg-accent/15 px-3 py-1 text-[13px] font-semibold text-accent">{playbook.style}</span>}
          {playbook.time_minutes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-fill px-3 py-1 text-[13px] text-muted">
              <Clock className="h-3.5 w-3.5" /> ~{playbook.time_minutes} min
            </span>
          )}
          <span className="text-[12px] text-faint">atualizado {relativeTime(playbook.updated_at)}</span>
        </div>
        <h3 className="mt-3 font-display text-[22px] font-bold">Como {name.split(" ")[0]} bola</h3>
        {playbook.intro && <p className="mt-2 leading-relaxed text-fg/85">{playbook.intro}</p>}
        {materials.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {materials.map((m) => (
              <div key={m.label} className="rounded-xl bg-fill px-3 py-2">
                <dt className="flex items-center gap-1 text-[12px] text-muted">
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </dt>
                <dd className="mt-0.5 text-[14px] font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <ol className="space-y-3">
        {playbook.steps.map((s, i) => (
          <li key={s.id} className="card flex gap-4 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[15px] font-bold text-accent-fg">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{s.title}</p>
              {s.body && <p className="mt-1 whitespace-pre-line leading-relaxed text-fg/80">{s.body}</p>}
              {s.media_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.media_url} alt={`Passo ${i + 1}: ${s.title}`} className="mt-3 max-h-80 w-full rounded-xl object-cover" loading="lazy" />
              )}
            </div>
          </li>
        ))}
      </ol>

      {playbook.tips && (
        <aside className="card flex gap-3 border-accent/30 bg-accent/5 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-[15px] font-semibold">Dica de quem manja</p>
            <p className="mt-1 whitespace-pre-line leading-relaxed text-fg/85">{playbook.tips}</p>
          </div>
        </aside>
      )}
    </article>
  );
}
