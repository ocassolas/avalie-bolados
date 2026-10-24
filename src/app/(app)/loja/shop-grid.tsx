"use client";

import { applyTheme } from "@/lib/theme-client";
import { Check, Eye, Flame, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { equipItem, purchaseItem } from "@/app/actions/app";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ShopItem, ShopKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTIONS: { kind: ShopKind; title: string; text: string }[] = [
  { kind: "theme", title: "Temas", text: "Muda as cores do app todo, para você." },
  { kind: "frame", title: "Molduras", text: "Um aro especial na sua foto." },
  { kind: "title", title: "Títulos", text: "Aparece embaixo do seu nome." },
];

export function ShopGrid({
  items,
  owned,
  brasas,
  level,
  active,
  name,
  avatarUrl,
  demo,
}: {
  items: ShopItem[];
  owned: string[];
  brasas: number;
  level: number;
  active: { theme: string; frame: string | null; title: string | null };
  name: string;
  avatarUrl: string | null;
  demo: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const ownedSet = new Set(owned);

  function preview(theme: string) {
    applyTheme(theme);
    toast(`Prévia do tema. Recarregue a página para voltar.`, { duration: 2500 });
  }

  function act(item: ShopItem, kind: "buy" | "equip" | "unequip") {
    if (demo) {
      if (item.kind === "theme" && item.data.value) applyTheme(item.data.value);
      toast.info("Modo demonstração: nada é salvo.");
      return;
    }
    setBusyKey(item.key);
    start(async () => {
      const res =
        kind === "buy" ? await purchaseItem(item.key) : await equipItem(item.kind, kind === "equip" ? item.key : null);
      setBusyKey(null);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Feito!");
      if (kind === "equip" && item.kind === "theme" && item.data.value) applyTheme(item.data.value);
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      {SECTIONS.map((s) => (
        <section key={s.kind}>
          <div className="mb-4">
            <h2 className="font-display text-[22px] font-bold">{s.title}</h2>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((i) => i.kind === s.kind)
              .map((item) => {
                const has = item.price === 0 || ownedSet.has(item.key);
                const value = item.data.value ?? null;
                const equipped =
                  (item.kind === "theme" && active.theme === value) ||
                  (item.kind === "frame" && active.frame === value) ||
                  (item.kind === "title" && active.title === value);
                const locked = level < item.min_level;
                const short = brasas < item.price;
                return (
                  <div key={item.key} className={cn("card flex flex-col overflow-hidden", equipped && "border-accent ring-2 ring-accent/30")}>
                    {/* Prévia */}
                    <div className="relative flex h-32 items-center justify-center border-b border-line" data-theme={item.kind === "theme" ? value ?? undefined : undefined} style={item.kind === "theme" ? { background: "var(--bg)" } : undefined}>
                      {item.kind === "theme" && (
                        <div className="flex w-3/4 flex-col gap-2 rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                          <div className="h-2 w-1/2 rounded-full" style={{ background: "var(--fg)", opacity: 0.8 }} />
                          <div className="h-2 w-1/3 rounded-full" style={{ background: "var(--muted)" }} />
                          <div className="mt-1 h-6 w-2/3 rounded-lg bg-foil" />
                        </div>
                      )}
                      {item.kind === "frame" && <Avatar name={name} src={avatarUrl} frame={value} size="lg" />}
                      {item.kind === "title" && (
                        <div className="text-center">
                          <p className="font-semibold">{name}</p>
                          <p className="text-sm text-accent">{value}</p>
                        </div>
                      )}
                      {equipped && (
                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">
                          <Check className="h-3 w-3" /> Em uso
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted">{item.description}</p>
                        </div>
                        {!has && (
                          <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-semibold tabular">
                            <Flame className="h-4 w-4 text-ember" />
                            {item.price}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2 pt-1">
                        {has ? (
                          equipped ? (
                            item.kind !== "theme" ? (
                              <Button size="sm" variant="ghost" className="flex-1" onClick={() => act(item, "unequip")} loading={pending && busyKey === item.key}>
                                Remover
                              </Button>
                            ) : (
                              <Button size="sm" variant="solid" className="flex-1" disabled>
                                Em uso
                              </Button>
                            )
                          ) : (
                            <Button size="sm" variant="gold" className="flex-1" onClick={() => act(item, "equip")} loading={pending && busyKey === item.key}>
                              Equipar
                            </Button>
                          )
                        ) : locked ? (
                          <Button size="sm" variant="solid" className="flex-1" disabled>
                            <Lock className="h-3.5 w-3.5" /> Nível {item.min_level}
                          </Button>
                        ) : (
                          <Button size="sm" variant={short ? "solid" : "gold"} className="flex-1" disabled={short} onClick={() => act(item, "buy")} loading={pending && busyKey === item.key}>
                            {short ? `Faltam ${item.price - brasas}` : "Comprar"}
                          </Button>
                        )}
                        {item.kind === "theme" && value && !equipped && (
                          <Button size="sm" variant="outline" onClick={() => preview(value)} aria-label="Prévia">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
