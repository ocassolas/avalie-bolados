"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ClipboardCheck, Flame, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RodaForms } from "@/app/(app)/rodas/forms";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

export function OnboardingFlow({ profile, hasRoda, demo }: { profile: Profile; hasRoda: boolean; demo: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const first = profile.display_name.split(" ")[0];

  const steps = [
    <div key="0" className="text-center">
      <LogoMark animated className="mx-auto h-40 w-40" />
      <h1 className="mt-6 font-display text-[34px] font-bold leading-[41px]">
        Bem-vindo, <span className="text-foil">{first}</span>.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">Sua conta está pronta. Três coisas rápidas sobre como funciona:</p>
      <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
        {[
          { icon: ClipboardCheck, t: "Checklist em duas fases", d: "Pré-crema antes de acender, pós-crema depois. Notas de 0 a 10." },
          { icon: Trophy, t: "Ranking com Nota Ouro", d: "A média justa da roda. Quem bola bem com constância sobe." },
          { icon: Flame, t: "XP e Brasas", d: "Você já ganhou 50 Brasas de boas-vindas para usar na loja." },
        ].map((i) => (
          <li key={i.t} className="card flex gap-3 p-4">
            <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">{i.t}</p>
              <p className="text-sm text-muted">{i.d}</p>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="gold" size="lg" className="mt-8" onClick={() => (hasRoda ? router.push("/inicio") : setStep(1))}>
        {hasRoda ? "Ir para o início" : "Bora"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,
    <div key="1">
      <h1 className="text-center font-display text-[34px] font-bold leading-[41px]">Escolha sua roda</h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-muted">Entre com o código que um amigo mandou ou crie a sua e convide a galera.</p>
      <div className="mt-8">
        <RodaForms demo={demo} onDone={() => router.push("/inicio")} />
      </div>
      <button type="button" onClick={() => router.push("/inicio")} className="mx-auto mt-6 block text-sm text-muted hover:text-fg">
        Fazer isso depois
      </button>
    </div>,
  ];

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
