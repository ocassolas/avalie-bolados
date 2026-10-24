"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { BookOpen, Copy, Crown, LogOut, MoreVertical, RefreshCw, Share2, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteRoda, regenerateInvite, removeMember, setMemberRole, updateRoda } from "@/app/actions/app";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Criterion, CriterionKey, Roda, RodaMember, RodaRole } from "@/lib/types";

const ROLE_LABEL: Record<RodaRole, string> = { owner: "Dono", admin: "Admin", member: "Membro" };

export function InviteCard({ rodaId, code, canRegenerate, demo }: { rodaId: string; code: string; canRegenerate: boolean; demo: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState(code);
  const [pending, start] = useTransition();
  const link = () => `${window.location.origin}/rodas?convite=${current}`;

  return (
    <section className="card card-glow p-5">
      <h2 className="font-display text-[17px] font-semibold">Convidar</h2>
      <p className="mt-1 text-sm text-muted">Mande o código ou o link. Quem entrar vê o ranking, os bolados e as fotos da roda.</p>
      <p className="mt-4 rounded-2xl border border-dashed border-accent/50 bg-accent/5 py-4 text-center font-mono text-3xl font-semibold tracking-[0.3em] text-accent">{current}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="solid"
          onClick={async () => {
            await navigator.clipboard.writeText(current);
            toast.success("Código copiado.");
          }}
        >
          <Copy className="h-4 w-4" /> Copiar código
        </Button>
        <Button
          size="sm"
          variant="gold"
          onClick={async () => {
            const url = link();
            if (navigator.share) await navigator.share({ title: "Entra na minha roda no Avalie Bolados", url }).catch(() => {});
            else {
              await navigator.clipboard.writeText(url);
              toast.success("Link de convite copiado.");
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </div>
      {canRegenerate && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (demo) return void toast.info("Modo demonstração.");
            if (!confirm("Gerar um código novo? O antigo para de funcionar.")) return;
            start(async () => {
              const res = await regenerateInvite(rodaId);
              if (!res.ok) return void toast.error(res.error);
              setCurrent(res.data!.code);
              toast.success("Código novo gerado.");
              router.refresh();
            });
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted hover:text-fg"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Gerar código novo
        </button>
      )}
    </section>
  );
}

export function MembersList({ rodaId, members, viewerId, myRole, demo, playbookOwners = [] }: { rodaId: string; members: RodaMember[]; viewerId: string; myRole: RodaRole; demo: boolean; playbookOwners?: string[] }) {
  const router = useRouter();
  const [, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, confirmMsg?: string) => {
    if (demo) return void toast.info("Modo demonstração.");
    if (confirmMsg && !confirm(confirmMsg)) return;
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      if (res.message) toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <section className="card p-5">
      <h2 className="mb-4 font-display text-[17px] font-semibold">Membros · {members.length}</h2>
      <ul className="-mx-2 space-y-1">
        {members.map((m) => {
          const isMe = m.profile.id === viewerId;
          const canManage = !isMe && m.role !== "owner" && (myRole === "owner" || (myRole === "admin" && m.role === "member"));
          return (
            <li key={m.profile.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
              <Link href={`/perfil/${m.profile.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={m.profile.display_name} src={m.profile.avatar_url} frame={m.profile.active_frame} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.profile.display_name} {isMe && <span className="text-xs text-accent">você</span>}
                  </p>
                  <p className="truncate text-xs text-muted">@{m.profile.username} · Nv. {m.profile.level}</p>
                </div>
              </Link>
              {playbookOwners.includes(m.profile.id) && (
                <Link
                  href={`/perfil/${m.profile.username}?aba=playbook`}
                  className="flex h-8 items-center gap-1 rounded-full bg-fill px-2.5 text-[12px] font-medium text-accent"
                  title={`Como ${m.profile.display_name} bola`}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Playbook
                </Link>
              )}
              <span className="flex items-center gap-1 text-xs text-muted">
                {m.role === "owner" && <Crown className="h-3.5 w-3.5 text-accent" />}
                {m.role === "admin" && <Shield className="h-3.5 w-3.5 text-accent" />}
                {ROLE_LABEL[m.role]}
              </span>
              {canManage && (
                <Menu.Root>
                  <Menu.Trigger className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg" aria-label={`Gerenciar ${m.profile.display_name}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Content align="end" sideOffset={4} className="z-50 min-w-52 rounded-xl border border-line bg-surface-2 p-1 shadow-2xl">
                      {myRole === "owner" && (
                        <>
                          <Item onSelect={() => run(() => setMemberRole(rodaId, m.profile.id, m.role === "admin" ? "member" : "admin"))}>
                            <Shield className="h-4 w-4" /> {m.role === "admin" ? "Tirar admin" : "Tornar admin"}
                          </Item>
                          <Item onSelect={() => run(() => setMemberRole(rodaId, m.profile.id, "owner"), `Transferir a roda para ${m.profile.display_name}? Você vira admin.`)}>
                            <Crown className="h-4 w-4" /> Transferir a roda
                          </Item>
                        </>
                      )}
                      <Item danger onSelect={() => run(() => removeMember(rodaId, m.profile.id), `Remover ${m.profile.display_name} da roda?`)}>
                        <Trash2 className="h-4 w-4" /> Remover da roda
                      </Item>
                    </Menu.Content>
                  </Menu.Portal>
                </Menu.Root>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Item({ children, onSelect, danger }: { children: React.ReactNode; onSelect: () => void; danger?: boolean }) {
  return (
    <Menu.Item
      onSelect={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none ${danger ? "text-danger data-[highlighted]:bg-danger/10" : "data-[highlighted]:bg-surface"}`}
    >
      {children}
    </Menu.Item>
  );
}

export function RodaSettings({ roda, criteria, demo }: { roda: Roda; criteria: Criterion[]; demo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(roda.name);
  const [desc, setDesc] = useState(roda.description ?? "");
  const [weights, setWeights] = useState<Partial<Record<CriterionKey, number>>>(roda.weights ?? {});

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (demo) return void toast.info("Modo demonstração.");
        start(async () => {
          // Só manda pesos diferentes do padrão
          const custom = Object.fromEntries(
            Object.entries(weights).filter(([k, v]) => v !== criteria.find((c) => c.key === k)?.weight),
          ) as Partial<Record<CriterionKey, number>>;
          const res = await updateRoda(roda.id, { name, description: desc }, custom);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message ?? "Salvo.");
          router.refresh();
        });
      }}
    >
      <h2 className="font-display text-[17px] font-semibold">Configurações da roda</h2>
      <Field label="Nome" htmlFor="rn">
        <Input id="rn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </Field>
      <Field label="Descrição" htmlFor="rd">
        <Textarea id="rd" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={280} className="min-h-20" />
      </Field>
      <div>
        <p className="text-sm font-medium">Peso de cada critério</p>
        <p className="mb-3 text-xs text-muted">Vale para as próximas avaliações. Peso 0 tira o critério da conta.</p>
        <div className="space-y-2">
          {criteria.map((c) => {
            const w = weights[c.key] ?? c.weight;
            return (
              <div key={c.key} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted">{c.label}</span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.5}
                  value={w}
                  onChange={(e) => setWeights((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
                  className="flex-1 accent-[var(--accent)]"
                  aria-label={`Peso de ${c.label}`}
                />
                <span className="w-8 text-right font-mono text-sm tabular">×{w.toLocaleString("pt-BR")}</span>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => setWeights({})} className="mt-2 text-xs text-muted hover:text-accent">
          Voltar aos pesos padrão
        </button>
      </div>
      <Button type="submit" variant="gold" className="w-full" loading={pending}>
        Salvar
      </Button>
    </form>
  );
}

export function RodaDangerZone({ rodaId, viewerId, isOwner, demo }: { rodaId: string; viewerId: string; isOwner: boolean; demo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="card space-y-3 p-5">
      {!isOwner && (
        <Button
          variant="outline"
          className="w-full"
          loading={pending}
          onClick={() => {
            if (demo) return void toast.info("Modo demonstração.");
            if (!confirm("Sair desta roda? Seus bolados continuam nela.")) return;
            start(async () => {
              const res = await removeMember(rodaId, viewerId);
              if (!res.ok) return void toast.error(res.error);
              router.push("/rodas");
            });
          }}
        >
          <LogOut className="h-4 w-4" /> Sair da roda
        </Button>
      )}
      {isOwner && (
        <>
          <p className="text-xs text-muted">Para sair, transfira a roda para alguém no menu de um membro.</p>
          <Button
            variant="danger"
            className="w-full"
            loading={pending}
            onClick={() => {
              if (demo) return void toast.info("Modo demonstração.");
              if (prompt('Isso apaga a roda, todos os bolados, avaliações e fotos dela. Digite APAGAR para confirmar.') !== "APAGAR") return;
              start(async () => {
                const res = await deleteRoda(rodaId);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Roda apagada.");
                router.push("/rodas");
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Apagar roda
          </Button>
        </>
      )}
    </section>
  );
}
