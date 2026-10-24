"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { BookOpen, ChevronRight, Contact, HelpCircle, Medal, Settings, ShoppingBag, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";

// Ícone em quadradinho colorido, como nos Ajustes do iPhone
const items = [
  { href: "/rodas", label: "Rodas", icon: Users, tone: "bg-[#0a84ff]" },
  { href: "/amigos", label: "Amigos", icon: Contact, tone: "bg-[#30b0c7]" },
  { href: "/playbook", label: "Meu playbook", icon: BookOpen, tone: "bg-[#af52de]" },
  { href: "/loja", label: "Loja", icon: ShoppingBag, tone: "bg-ember" },
  { href: "/conquistas", label: "Conquistas", icon: Medal, tone: "bg-accent" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, tone: "bg-[#8e8e93]" },
  { href: "/como-usar", label: "Como usar", icon: HelpCircle, tone: "bg-success" },
];

export function MobileMenu({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="press flex h-8 w-8 items-center justify-center rounded-full bg-fill text-accent" aria-label="Abrir menu">
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content className="sheet fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-bg-2 px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-2">
          <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-fill-strong" aria-hidden />
          <div className="mb-3 flex items-center justify-between px-1">
            <Dialog.Title className="font-display text-[20px] font-bold">Mais</Dialog.Title>
            <Dialog.Close className="press rounded-full px-1 text-[17px] font-semibold text-accent">OK</Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Outras páginas do app</Dialog.Description>
          <nav className="list-group">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center gap-3 px-4 text-[17px] transition-colors active:bg-fill"
              >
                <span className={`flex h-[29px] w-[29px] items-center justify-center rounded-[7px] text-white ${i.tone}`}>
                  <i.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span className="flex-1">{i.label}</span>
                <ChevronRight className="h-4 w-4 text-faint" />
              </Link>
            ))}
          </nav>
          <div className="list-group mt-6">
            <SignOutButton className="h-12 w-full justify-center rounded-none text-[17px] font-normal" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
