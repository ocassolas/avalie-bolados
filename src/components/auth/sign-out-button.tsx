"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

/** "Sair da conta" com confirmação num alerta do iOS. */
export function SignOutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <Dialog.Trigger
        className={cn("press flex h-9 items-center gap-3 rounded-[10px] px-3 text-[15px] text-danger transition-colors hover:bg-fill", className)}
      >
        <LogOut className="h-[18px] w-[18px]" /> Sair da conta
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="alert-overlay fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="alert fixed left-1/2 top-1/2 z-[60] w-[270px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-surface-2/90 text-center shadow-2xl backdrop-blur-2xl">
          <div className="px-4 pb-4 pt-5">
            <Dialog.Title className="text-[17px] font-semibold leading-snug">Sair da conta?</Dialog.Title>
            <Dialog.Description className="mt-1 text-[13px] leading-snug text-fg/80">
              Para entrar de novo neste aparelho, você vai precisar do e-mail e da senha.
            </Dialog.Description>
          </div>
          <div className="grid grid-cols-2 border-t-[0.5px] border-line-strong text-[17px]">
            <Dialog.Close disabled={pending} className="h-11 text-accent transition-colors active:bg-fill disabled:opacity-40">
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => signOut())}
              className="h-11 border-l-[0.5px] border-line-strong font-semibold text-danger transition-colors active:bg-fill disabled:opacity-60"
            >
              {pending ? "Saindo…" : "Sair"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
