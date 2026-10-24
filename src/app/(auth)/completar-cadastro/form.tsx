"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeProfile, signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/field";
import { completeProfileSchema, fieldErrors } from "@/lib/validation";

const maxBirth = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

export function CompleteForm({ initialName, initialUsername }: { initialName: string; initialUsername: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [v, setV] = useState({
    display_name: initialName,
    username: initialUsername,
    birthdate: "",
    consent_terms: false,
    consent_privacy: false,
    consent_sensitive_data: false,
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = completeProfileSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    start(async () => {
      const res = await completeProfile(v);
      if (!res.ok) {
        setErrors(res.fields ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Cadastro completo. Bem-vindo à roda!");
      router.push("/onboarding");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="display_name" error={errors.display_name}>
          <Input id="display_name" value={v.display_name} maxLength={40} onChange={(e) => set("display_name", e.target.value)} aria-invalid={!!errors.display_name} />
        </Field>
        <Field label="Usuário" htmlFor="username" error={errors.username} hint="Seu @ no app">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">@</span>
            <Input
              id="username"
              autoCapitalize="none"
              className="pl-8"
              maxLength={20}
              value={v.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              aria-invalid={!!errors.username}
            />
          </div>
        </Field>
      </div>
      <Field label="Data de nascimento" htmlFor="birthdate" error={errors.birthdate} hint="O app é só para maiores de 18 anos.">
        <Input id="birthdate" type="date" max={maxBirth()} min="1900-01-01" value={v.birthdate} onChange={(e) => set("birthdate", e.target.value)} aria-invalid={!!errors.birthdate} />
      </Field>

      <fieldset className="space-y-3 rounded-2xl border border-line bg-bg-2/60 p-4">
        <legend className="px-1 text-[13px] uppercase text-muted">Seus dados, suas regras</legend>
        <Checkbox checked={v.consent_terms} onChange={(c) => set("consent_terms", c)} error={errors.consent_terms}>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="text-accent underline-offset-2 hover:underline">
            Termos de Uso
          </Link>
          .
        </Checkbox>
        <Checkbox checked={v.consent_privacy} onChange={(c) => set("consent_privacy", c)} error={errors.consent_privacy}>
          Li e aceito a{" "}
          <Link href="/privacidade" target="_blank" className="text-accent underline-offset-2 hover:underline">
            Política de Privacidade
          </Link>
          .
        </Checkbox>
        <Checkbox checked={v.consent_sensitive_data} onChange={(c) => set("consent_sensitive_data", c)} error={errors.consent_sensitive_data}>
          Autorizo o tratamento das minhas avaliações, fotos e hábitos registrados no app, que podem ser dados sensíveis, só para
          o funcionamento do app. Posso revogar quando quiser.
        </Checkbox>
      </fieldset>

      <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
        Concluir cadastro
      </Button>
      <button type="button" onClick={() => signOut()} className="mx-auto block text-sm text-muted hover:text-fg">
        Não sou eu, sair
      </button>
    </form>
  );
}
