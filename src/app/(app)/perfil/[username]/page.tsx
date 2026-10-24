import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, Lock, Pencil } from "lucide-react";
import { PlaybookView } from "@/components/playbook/playbook-view";
import { FriendButton, type Relation } from "@/components/social/friend-button";
import { TierBadge } from "@/components/social/tier-badge";
import { IS_DEMO } from "@/lib/env";
import { BoladoCard } from "@/components/bolado/bolado-card";
import { Radar } from "@/components/charts/radar";
import { BadgeIcon } from "@/components/gamification/badge-icon";
import { MediaGallery } from "@/components/media/gallery";
import { PillTabs } from "@/components/ranking/roda-switch";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, Stat } from "@/components/ui/misc";
import { ScoreValue } from "@/components/ui/score";
import {
  getBadges,
  getBolados,
  getEvaluationsBy,
  getFriends,
  getPlaybook,
  getSkill,
  getProfileByUsername,
  getProfileMedia,
  getProfileStats,
  getUserBadges,
  requireViewer,
} from "@/lib/data";
import { levelProgress, levelTitle } from "@/lib/levels";
import { formatScore } from "@/lib/scoring";
import { BOLADO_TYPES, CONTENT_BY_KEY, TYPE_INFO } from "@/lib/contents";
import { formatDate, relativeTime } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/perfil/[username]">) {
  return { title: `@${(await params).username}` };
}

const TABS = [
  { value: "bolados", label: "Bolados" },
  { value: "avaliacoes", label: "Avaliações" },
  { value: "fotos", label: "Fotos" },
  { value: "videos", label: "Vídeos" },
  { value: "playbook", label: "Playbook" },
];

export default async function PerfilPage({ params, searchParams }: PageProps<"/perfil/[username]">) {
  const { username } = await params;
  const { aba } = (await searchParams) as { aba?: string };
  const tab = TABS.some((t) => t.value === aba) ? aba! : "bolados";
  const [viewer, profile] = await Promise.all([requireViewer(), getProfileByUsername(username)]);
  if (!profile) notFound();
  const isMe = profile.id === viewer.id;
  const friendship = isMe ? undefined : (await getFriends()).find((f) => f.id === profile.id);
  const relation: Relation = !friendship ? "none" : friendship.status === "accepted" ? "friend" : friendship.direction;
  const friendBtn = !isMe && (
    <FriendButton userId={profile.id} username={profile.username} relation={relation} friendshipId={friendship?.friendship_id} demo={IS_DEMO} />
  );

  const stats = await getProfileStats(profile.id);
  if (!stats) {
    return (
      <EmptyState icon={<Lock className="h-6 w-6" />} title="Perfil privado" action={friendBtn}>
        @{profile.username} só aparece para amigos e para quem está numa roda com ele(a).
      </EmptyState>
    );
  }

  const [badges, userBadges, skill] = await Promise.all([getBadges(), getUserBadges(profile.id), getSkill(profile.id)]);
  const owned = new Set(userBadges.map((b) => b.badge_key));
  const lp = levelProgress(profile.xp);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={profile.display_name} src={profile.avatar_url} frame={profile.active_frame} size="2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[34px] font-bold leading-[41px]">{profile.display_name}</h1>
              <TierBadge nota={skill?.nota} bolados={skill?.bolados} />
              {!profile.is_public && <span className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted"><Lock className="h-3 w-3" /> privado</span>}
            </div>
            <p className="mt-1 text-muted">
              @{profile.username}
              {profile.active_title && <> · <span className="text-accent">{profile.active_title}</span></>}
            </p>
            {profile.bio && <p className="mt-3 max-w-xl text-fg/85">{profile.bio}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
              <CalendarDays className="h-3.5 w-3.5" /> No app desde {formatDate(profile.created_at, { month: "long", year: "numeric" })}
            </p>
          </div>
          {isMe ? (
            <div className="flex gap-2 self-start">
              <Button asChild variant="outline" size="sm">
                <Link href="/configuracoes#perfil">
                  <Pencil className="h-4 w-4" /> Editar perfil
                </Link>
              </Button>
              <Button asChild variant="solid" size="sm">
                <Link href="/playbook">
                  <BookOpen className="h-4 w-4" /> Playbook
                </Link>
              </Button>
            </div>
          ) : (
            <div className="self-start">{friendBtn}</div>
          )}
        </div>
        <div className="relative mt-6">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-semibold text-accent">Nível {profile.level} · {levelTitle(profile.level)}</span>
            <span className="font-mono text-muted tabular">{profile.xp} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-foil" style={{ width: `${Math.min(100, lp.pct * 100)}%` }} />
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Bolados" value={stats.bolados} />
        <Stat label="Melhor nota" value={<ScoreValue value={stats.best} />} />
        <Stat
          label="Média por tipo"
          className="col-span-2"
          value={
            Object.keys(stats.by_type ?? {}).length ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-base">
                {BOLADO_TYPES.filter((t) => stats.by_type?.[t] != null).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="font-sans text-xs font-normal text-muted">{TYPE_INFO[t].label}</span>
                    <ScoreValue value={Number(stats.by_type![t])} digits={2} />
                  </span>
                ))}
              </span>
            ) : (
              "—"
            )
          }
          hint={stats.top_contents?.length ? `Curte: ${stats.top_contents.slice(0, 3).map((k) => CONTENT_BY_KEY[k]?.label ?? k).join(", ")}` : undefined}
        />
        <Stat label="Avaliações" value={stats.evaluations_given} hint="feitas" />
        <Stat label="Nota que dá" value={formatScore(stats.avg_given, 2)} hint={stats.avg_given == null ? undefined : stats.avg_given >= 8.5 ? "mão aberta" : stats.avg_given < 6.5 ? "exigente" : "equilibrado"} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-5">
            <PillTabs basePath={`/perfil/${profile.username}`} param="aba" active={tab} options={TABS} />
          </div>
          <ProfileTab tab={tab} userId={profile.id} viewerId={viewer.id} name={profile.display_name} />
        </section>

        <aside className="space-y-6">
          {Object.keys(stats.criteria).length > 0 && (
            <section className="card p-5">
              <h2 className="font-display text-[17px] font-semibold">Pontos fortes</h2>
              <p className="text-xs text-muted">Média por critério nas notas recebidas</p>
              <div className="mt-2 flex justify-center">
                <Radar values={stats.criteria} />
              </div>
            </section>
          )}
          <section className="card p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-[17px] font-semibold">Conquistas</h2>
              <span className="font-mono text-xs text-muted">
                {owned.size}/{badges.length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {badges.map((b) => (
                <div key={b.key} title={`${b.name}: ${b.description}`} className="flex flex-col items-center gap-1">
                  <BadgeIcon badge={b} owned={owned.has(b.key)} size="sm" />
                  <span className="line-clamp-1 text-center text-[10px] text-muted">{b.name}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function ProfileTab({ tab, userId, viewerId, name }: { tab: string; userId: string; viewerId: string; name: string }) {
  if (tab === "playbook") {
    const playbook = await getPlaybook(userId);
    if (!playbook) {
      return userId === viewerId ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="Você ainda não tem playbook" action={<Button asChild variant="gold"><Link href="/playbook">Criar meu playbook</Link></Button>}>
          Mostre pra roda o seu jeito de bolar, passo a passo. É opcional.
        </EmptyState>
      ) : (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="Sem playbook">
          {name.split(" ")[0]} ainda não contou como bola.
        </EmptyState>
      );
    }
    return <PlaybookView playbook={playbook} name={name} />;
  }
  if (tab === "avaliacoes") {
    const evals = await getEvaluationsBy(userId);
    if (!evals.length) return <EmptyState title="Nenhuma avaliação ainda" />;
    return (
      <ul className="card divide-y divide-line">
        {evals.map((e) => (
          <li key={e.id}>
            <Link href={`/bolados/${e.bolado.id}`} className="flex items-center gap-3 p-4 transition hover:bg-surface-2">
              <Avatar name={e.bolado.roller.display_name} src={e.bolado.roller.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  Avaliou <strong>{e.bolado.roller.display_name}</strong> · {e.bolado.type === "beck" ? "beck" : "tabaco"}
                </p>
                {e.feedback ? <p className="truncate text-xs italic text-muted">“{e.feedback}”</p> : <p className="text-xs text-muted">{relativeTime(e.created_at)}</p>}
              </div>
              <ScoreValue value={e.total} className="text-lg" />
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (tab === "fotos" || tab === "videos") {
    const media = (await getProfileMedia(userId)).filter((m) => (tab === "fotos" ? m.kind === "photo" : m.kind !== "photo"));
    if (!media.length) return <EmptyState title={tab === "fotos" ? "Nenhuma foto ainda" : "Nenhum vídeo ainda"}>As mídias dos bolados aparecem aqui.</EmptyState>;
    return <MediaGallery media={media} viewerId={viewerId} isAdmin={false} />;
  }
  const bolados = await getBolados({ rollerId: userId, limit: 24 });
  if (!bolados.length) return <EmptyState title="Nenhum bolado ainda">Quando bolar, registra aqui para a roda avaliar.</EmptyState>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {bolados.map((b) => (
        <BoladoCard key={b.id} bolado={b} showRoda />
      ))}
    </div>
  );
}
