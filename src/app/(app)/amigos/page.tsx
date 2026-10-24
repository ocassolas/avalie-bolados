import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { FriendButton } from "@/components/social/friend-button";
import { TierBadge, TierCard } from "@/components/social/tier-badge";
import { UserSearch } from "@/components/social/user-search";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ScoreValue } from "@/components/ui/score";
import { getFriends, getPlaybookOwners, getSkill, getSkillPeers, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";
import { tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export const metadata = { title: "Amigos" };

export default async function AmigosPage() {
  const viewer = await requireViewer();
  const [friends, mySkill, peers] = await Promise.all([getFriends(), getSkill(viewer.id), getSkillPeers()]);
  const accepted = friends.filter((f) => f.status === "accepted");
  const incoming = friends.filter((f) => f.status === "pending" && f.direction === "incoming");
  const outgoing = friends.filter((f) => f.status === "pending" && f.direction === "outgoing");
  const playbooks = await getPlaybookOwners(accepted.map((f) => f.id));

  // Ranking entre amigos (eu incluso), pela Nota Ouro global
  const me = { ...viewer.profile, bolados: mySkill?.bolados ?? 0, nota: mySkill?.nota ?? null };
  const board = [...accepted.map((f) => ({ ...f, isMe: false })), { ...me, isMe: true }].sort(
    (a, b) => (b.nota ?? -1) - (a.nota ?? -1) || b.bolados - a.bolados,
  );

  // Do meu nível: mesma faixa de rank (ou vizinhas, se ninguém estiver na minha)
  const myTier = tierFor(me.nota, me.bolados);
  const ranked = peers.map((p) => ({ ...p, t: tierFor(p.nota, p.bolados) })).filter((p) => p.t.status === "ranked");
  let sameLevel = myTier.status === "ranked" ? ranked.filter((p) => p.t.index === myTier.index) : [];
  const widened = myTier.status === "ranked" && sameLevel.length === 0;
  if (widened) sameLevel = ranked.filter((p) => Math.abs(p.t.index - myTier.index) === 1);

  return (
    <div>
      <PageHeader eyebrow="Social" title="Amigos" subtitle="Adicione a galera, veja o rank de cada um e quem bola no seu nível." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {incoming.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 text-[17px] font-semibold">Pedidos de amizade · {incoming.length}</h2>
              <ul className="space-y-1">
                {incoming.map((f) => (
                  <li key={f.friendship_id} className="flex flex-wrap items-center gap-3 rounded-xl p-2">
                    <Link href={`/perfil/${f.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={f.display_name} src={f.avatar_url} frame={f.active_frame} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{f.display_name}</p>
                        <p className="truncate text-[13px] text-muted">@{f.username}</p>
                      </div>
                    </Link>
                    <FriendButton userId={f.id} username={f.username} relation="incoming" friendshipId={f.friendship_id} demo={IS_DEMO} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-1 text-[17px] font-semibold">Ranking dos amigos</h2>
            <p className="mb-4 text-[13px] text-muted">Pela Nota Ouro de todos os bolados avaliados de cada um.</p>
            {accepted.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum amigo ainda">
                Procure pelo @ ao lado ou adicione alguém direto do perfil.
              </EmptyState>
            ) : (
              <ol className="divide-y divide-line">
                {board.map((f, i) => (
                  <li key={f.id}>
                    <Link href={`/perfil/${f.username}`} className={cn("flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-fill", f.isMe && "bg-accent/5")}>
                      <span className={cn("w-6 text-center font-mono text-sm tabular", i < 3 ? "font-bold text-accent" : "text-faint")}>{i + 1}</span>
                      <Avatar name={f.display_name} src={f.avatar_url} frame={f.active_frame} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-[15px] font-medium">
                          {f.display_name}
                          {f.isMe && <span className="text-xs text-accent">você</span>}
                          {!f.isMe && playbooks.has(f.id) && <BookOpen className="h-3.5 w-3.5 text-muted" aria-label="Tem playbook" />}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <TierBadge nota={f.nota} bolados={f.bolados} size="sm" />
                          <span className="text-[12px] text-faint">{f.bolados} avaliado{f.bolados === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <ScoreValue value={f.nota} digits={2} className="text-lg" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-1 text-[17px] font-semibold">Do seu nível</h2>
            <p className="mb-4 text-[13px] text-muted">
              {myTier.status === "calibrating"
                ? "Assim que você tiver rank, aparece aqui quem bola no mesmo nível que você."
                : widened
                  ? `Ninguém no ${myTier.tier.name} por enquanto. Quem está logo acima ou abaixo:`
                  : `Gente que você conhece no ${myTier.tier.name}, o mesmo rank que você.`}
            </p>
            {myTier.status === "ranked" && sameLevel.length === 0 && <p className="text-[13px] text-faint">Ninguém por perto ainda.</p>}
            <ul className="space-y-1">
              {sameLevel.slice(0, 12).map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl p-2">
                  <Link href={`/perfil/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={p.display_name} src={p.avatar_url} frame={p.active_frame} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{p.display_name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <TierBadge nota={p.nota} bolados={p.bolados} size="sm" />
                        <ScoreValue value={p.nota} digits={2} className="text-[13px]" />
                      </div>
                    </div>
                  </Link>
                  {!p.is_friend && <FriendButton userId={p.id} username={p.username} relation="none" demo={IS_DEMO} />}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <TierCard nota={me.nota} bolados={me.bolados} />
          <UserSearch demo={IS_DEMO} />
          {outgoing.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 text-[15px] font-semibold text-muted">Pedidos enviados</h2>
              <ul className="space-y-1">
                {outgoing.map((f) => (
                  <li key={f.friendship_id} className="flex items-center gap-3 rounded-xl p-1">
                    <Avatar name={f.display_name} src={f.avatar_url} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[14px]">@{f.username}</span>
                    <FriendButton userId={f.id} username={f.username} relation="outgoing" demo={IS_DEMO} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
