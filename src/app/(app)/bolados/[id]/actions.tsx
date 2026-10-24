"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBolado } from "@/app/actions/app";

export function BoladoActions({ id, demo }: { id: string; demo: boolean }) {
  const router = useRouter();
  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label="Mais ações">
        <MoreHorizontal className="h-5 w-5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} className="z-50 min-w-48 rounded-xl border border-line bg-surface-2 p-1 shadow-2xl">
          <Menu.Item
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface"
            onSelect={async () => {
              const url = window.location.href;
              if (navigator.share) await navigator.share({ title: "Avalie Bolados", url }).catch(() => {});
              else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copiado. Só quem é da roda consegue abrir.");
              }
            }}
          >
            <Share2 className="h-4 w-4" /> Compartilhar com a roda
          </Menu.Item>
          <Menu.Item
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger outline-none data-[highlighted]:bg-danger/10"
            onSelect={async () => {
              if (demo) return toast.info("Modo demonstração.");
              if (!confirm("Apagar este bolado, as avaliações e as mídias? Não dá para desfazer.")) return;
              const res = await deleteBolado(id);
              if (!res.ok) return toast.error(res.error);
              toast.success("Bolado apagado.");
              router.push("/inicio");
            }}
          >
            <Trash2 className="h-4 w-4" /> Apagar bolado
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
