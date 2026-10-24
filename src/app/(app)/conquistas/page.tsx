import { Flame, Sparkles } from "lucide-react";
import { BadgeIcon, RARITY_LABEL } from "@/components/gamification/badge-icon";
import { PageHeader } from "@/components/ui/misc";
import { getBadges, getUserBadges, getXpEvents, requireViewer } from "@/lib/data";
import { DAILY_XP_CAP, LEVEL_TIERS, XP_RULES, levelProgress } from "@/lib/levels";
import { cn, formatDate, relativeTime } from "@/lib/utils";

export const metadata = { title: "Conquistas" };

const KIND_LABEL: Record<string, string> = {
  welcome: "Bônus de boas-vindas",
  daily: "Primeira atividade do dia",
  bolado_rolled: "Bolou um bolado",
  bolado_registered: "Registrou um bolado",
  evaluation_given: "Avaliou um bolado",
  evaluation_received: "Recebeu uma avaliação",
  high_score: "Recebeu nota 9 ou mais",
  media_photo: "Enviou uma foto",
  media_video: "Enviou um vídeo",
  media_link: "Adicionou um link de vídeo",
  roda_created: "Criou uma roda",
  level_up: "Subiu de nível",
};

function kindLabel(k: string) {
  if (k.startsWith("badge:")) return "Conquista desbloqueada";
  if (k.startsWith("purchase:")) return "Compra na loja";
  return KIND_LABEL[k] ?? k;
}

export default async function ConquistasPage() {
  const viewer = await requireViewer();
  const [badges, mine, events] = await Promise.all([getBadges(), getUserBadges(viewer.id), getXpEvents(25)]);
  const owned = new Map(mine.map((b) => [b.badge_key, b.awarded_at]));
  const lp = levelProgress(viewer.profile.xp);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Gamificação" title="Conquistas e XP" subtitle={`${owned.size} de ${badges.length} conquistas desbloqueadas.`} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => {
          const at = owned.get(b.key);
          return (
            <div key={b.key} className={cn("card flex items-center gap-4 p-4", !at && "opacity-70")}>
              <BadgeIcon badge={b} owned={!!at} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{b.name}</p>
                <p className="text-sm text-muted">{b.description}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-faint">
                  <span>{RARITY_LABEL[b.rarity]}</span>·
                  <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-ember" />{b.reward_brasas}</span>
                  {at && <>· <span className="text-accent">desde {formatDate(at, { day: "2-digit", month: "short" })}</span></>}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-[20px] font-bold">Como ganhar XP e Brasas</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {XP_RULES.map((r) => (
              <li key={r.action} className="flex items-center justify-between py-2.5">
                <span className="text-muted">{r.action}</span>
                <span className="flex gap-3 font-mono tabular">
                  {r.xp > 0 && <span className="text-accent">+{r.xp} XP</span>}
                  <span className="text-ember">+{r.brasas}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-faint">Teto de {DAILY_XP_CAP} XP por dia, para manter o jogo justo. Conquistas dão Brasas extras.</p>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-[20px] font-bold">Níveis</h2>
          <ol className="mt-4 space-y-2">
            {LEVEL_TIERS.map((t, i) => {
              const next = LEVEL_TIERS[i + 1];
              const current = lp.level >= t.level && (!next || lp.level < next.level);
              return (
                <li key={t.level} className={cn("flex items-center justify-between rounded-xl px-3 py-2 text-sm", current ? "bg-accent/10 ring-1 ring-accent/40" : lp.level >= t.level ? "text-fg" : "text-faint")}>
                  <span className="flex items-center gap-2">
                    {current && <Sparkles className="h-4 w-4 text-accent" />}
                    <span className="font-medium">{t.title}</span>
                  </span>
                  <span className="font-mono text-xs tabular">Nv. {t.level} · {t.xp} XP</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-display text-[20px] font-bold">Extrato</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p>{kindLabel(e.kind)}</p>
                  <p className="text-xs text-faint">{relativeTime(e.created_at)}</p>
                </div>
                <span className="flex gap-3 font-mono tabular">
                  {e.xp !== 0 && <span className="text-accent">+{e.xp} XP</span>}
                  {e.brasas !== 0 && <span className={e.brasas < 0 ? "text-danger" : "text-ember"}>{e.brasas > 0 ? "+" : ""}{e.brasas}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
