"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signUp } from "@/app/actions/auth";
import { PasswordInput, StrengthMeter } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { fieldErrors, signUpSchema } from "@/lib/validation";

const maxBirth = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

export function SignUpForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [v, setV] = useState({
    display_name: "",
    username: "",
    email: "",
    birthdate: "",
    password: "",
    confirm: "",
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
    const parsed = signUpSchema.safeParse(v);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    start(async () => {
      const res = await signUp(v);
      if (!res.ok) {
        setErrors(res.fields ?? {});
        toast.error(res.error);
        return;
      }
      if (res.data?.needsConfirmation) setSentTo(v.email);
      else router.push("/onboarding");
    });
  }

  if (sentTo) {
    return (
      <div className="card card-glow p-8 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-4 font-display text-[22px] font-bold">Confirme seu e-mail</h2>
        <p className="mt-2 text-muted">
          Mandamos um link para <strong className="text-fg">{sentTo}</strong>. Clique nele para ativar sua conta e entrar.
        </p>
        <p className="mt-4 text-xs text-faint">Não chegou? Olhe o spam ou a aba Promoções.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/entrar">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="display_name" error={errors.display_name}>
          <Input id="display_name" autoComplete="nickname" value={v.display_name} onChange={(e) => set("display_name", e.target.value)} aria-invalid={!!errors.display_name} placeholder="Como a roda te chama" />
        </Field>
        <Field label="Usuário" htmlFor="username" error={errors.username} hint="Seu @ no app">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">@</span>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              className="pl-8"
              value={v.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              aria-invalid={!!errors.username}
              placeholder="seu.nome"
              maxLength={20}
            />
          </div>
        </Field>
      </div>
      <Field label="E-mail" htmlFor="email" error={errors.email}>
        <Input id="email" type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} placeholder="voce@email.com" />
      </Field>
      <Field label="Data de nascimento" htmlFor="birthdate" error={errors.birthdate} hint="O app é só para maiores de 18 anos.">
        <Input id="birthdate" type="date" max={maxBirth()} min="1900-01-01" value={v.birthdate} onChange={(e) => set("birthdate", e.target.value)} aria-invalid={!!errors.birthdate} />
      </Field>
      <Field label="Senha" htmlFor="password" error={errors.password} hint="Mínimo de 8 caracteres, com letras e números.">
        <PasswordInput id="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} aria-invalid={!!errors.password} />
      </Field>
      <StrengthMeter password={v.password} />
      <Field label="Confirmar senha" htmlFor="confirm" error={errors.confirm}>
        <PasswordInput id="confirm" autoComplete="new-password" value={v.confirm} onChange={(e) => set("confirm", e.target.value)} aria-invalid={!!errors.confirm} />
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
        Criar minha conta
      </Button>
    </form>
  );
}
