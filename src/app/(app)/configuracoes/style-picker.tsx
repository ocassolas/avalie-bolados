"use client";

import { Check, Flame, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { equipItem, purchaseItem } from "@/app/actions/app";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile, ShopItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "frame" | "title";

/**
 * Moldura e título dentro do "Editar perfil". Tocar numa opção mostra a prévia
 * na hora; as que você já tem são equipadas direto, as outras dá para comprar ali.
 */
export function ProfileStylePicker({
  profile,
  items,
  owned,
  demo,
}: {
  profile: Profile;
  items: ShopItem[];
  owned: string[];
  demo: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ownedSet = new Set(owned);
  const has = (i: ShopItem) => i.price === 0 || ownedSet.has(i.key);
  const keyOf = (kind: Kind, value: string | null) => items.find((i) => i.kind === kind && i.data.value === value)?.key ?? null;

  // Seleção em prévia (pode ser algo que ainda não é seu)
  const [sel, setSel] = useState<Record<Kind, string | null>>({
    frame: keyOf("frame", profile.active_frame),
    title: keyOf("title", profile.active_title),
  });
  const item = (key: string | null) => (key ? items.find((i) => i.key === key) ?? null : null);
  const frame = item(sel.frame);
  const title = item(sel.title);
  const toBuy = [frame, title].filter((i): i is ShopItem => !!i && !has(i));
  const cost = toBuy.reduce((s, i) => s + i.price, 0);
  const lockedBy = toBuy.find((i) => profile.level < i.min_level);

  function choose(kind: Kind, i: ShopItem | null) {
    setSel((s) => ({ ...s, [kind]: i?.key ?? null }));
    // O que já é seu entra em uso na hora
    if (i && !has(i)) return;
    if (demo) return void toast.info("Modo demonstração: nada é salvo.");
    start(async () => {
      const res = await equipItem(kind, i?.key ?? null);
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    });
  }

  function buyAndEquip() {
    if (demo) return void toast.info("Modo demonstração: nada é salvo.");
    start(async () => {
      for (const i of toBuy) {
        const bought = await purchaseItem(i.key);
        if (!bought.ok) return void toast.error(bought.error);
        const eq = await equipItem(i.kind, i.key);
        if (!eq.ok) return void toast.error(eq.error);
      }
      toast.success(toBuy.length > 1 ? "Comprados e em uso!" : "Comprado e em uso!");
      router.refresh();
    });
  }

  const row = (kind: Kind, label: string) => (
    <div>
      <p className="mb-2 px-1 text-[13px] text-muted">{label}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        <Option on={sel[kind] === null} onClick={() => choose(kind, null)}>
          Nenhum{kind === "frame" ? "a" : ""}
        </Option>
        {items
          .filter((i) => i.kind === kind)
          .map((i) => (
            <Option key={i.key} on={sel[kind] === i.key} onClick={() => choose(kind, i)}>
              {kind === "frame" ? i.name : i.data.value}
              {!has(i) &&
                (profile.level < i.min_level ? (
                  <Lock className="h-3 w-3 opacity-60" />
                ) : (
                  <span className="flex items-center gap-0.5 font-mono text-[12px] opacity-70">
                    <Flame className="h-3 w-3 text-ember" />
                    {i.price}
                  </span>
                ))}
            </Option>
          ))}
      </div>
    </div>
  );

  return (
    <div className="mt-6 space-y-5 border-t-[0.5px] border-line pt-6">
      {/* Prévia de como os outros te veem */}
      <div className="flex items-center gap-4 rounded-2xl bg-fill p-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} frame={frame?.data.value ?? null} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{profile.display_name}</p>
          <p className={cn("truncate text-[15px]", title ? "text-accent" : "text-faint")}>{title?.data.value ?? "Sem título"}</p>
        </div>
      </div>

      {row("frame", "Moldura da foto")}
      {row("title", "Título embaixo do nome")}

      {toBuy.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            {lockedBy ? (
              <>Libera no nível {lockedBy.min_level}. Você está no {profile.level}.</>
            ) : profile.brasas < cost ? (
              <>Faltam {cost - profile.brasas} Brasas. Você ganha bolando e avaliando.</>
            ) : (
              <>Isso é só uma prévia. Comprar e usar?</>
            )}
          </p>
          {!lockedBy && (
            <Button size="sm" variant="gold" loading={pending} disabled={profile.brasas < cost} onClick={buyAndEquip}>
              <Flame className="h-4 w-4" /> {cost} · Comprar e usar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px]",
        on ? "bg-accent font-semibold text-accent-fg" : "bg-fill text-fg",
      )}
    >
      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}
