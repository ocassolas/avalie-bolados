"use client";

import { KeyRound, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createRoda, joinRoda } from "@/app/actions/app";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export function RodaForms({ demo, initialCode, onDone }: { demo: boolean; initialCode?: string; onDone?: (id: string) => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const done = (id: string) => (onDone ? onDone(id) : router.push(`/rodas/${id}`));

  return (
    <div className="space-y-6">
      <form
        className="card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (demo) return void toast.info("Modo demonstração.");
          start(async () => {
            const res = await joinRoda(code);
            if (!res.ok) return void toast.error(res.error);
            toast.success("Você entrou na roda!");
            done(res.data!.id);
          });
        }}
      >
        <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold">
          <KeyRound className="h-5 w-5 text-accent" /> Entrar com código
        </h2>
        <p className="mt-1 text-sm text-muted">Peça o código de 8 letras para quem é da roda.</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="EX: A1B2C3D4"
            maxLength={12}
            className="font-mono tracking-[0.2em] uppercase"
            aria-label="Código de convite"
          />
          <Button type="submit" variant="solid" loading={pending} disabled={code.length < 6}>
            Entrar
          </Button>
        </div>
      </form>

      <form
        className="card space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (demo) return void toast.info("Modo demonstração.");
          start(async () => {
            const res = await createRoda({ name, description: desc });
            if (!res.ok) return void toast.error(res.error);
            toast.success("Roda criada! Agora chame a galera.");
            done(res.data!.id);
          });
        }}
      >
        <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold">
          <Plus className="h-5 w-5 text-accent" /> Criar uma roda
        </h2>
        <Field label="Nome" htmlFor="roda-name">
          <Input id="roda-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ex.: Roda dos Brabos" />
        </Field>
        <Field label="Descrição" htmlFor="roda-desc">
          <Textarea id="roda-desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={280} placeholder="Opcional" className="min-h-20" />
        </Field>
        <Button type="submit" variant="gold" className="w-full" loading={pending} disabled={name.trim().length < 2}>
          Criar roda
        </Button>
      </form>
    </div>
  );
}
