"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/app/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function SignInForm({ next }: { next?: string }) {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await signIn({ email, password }, next);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="E-mail" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between">
            Senha
            <Link href="/recuperar-senha" className="text-xs font-normal text-muted hover:text-accent">
              Esqueci a senha
            </Link>
          </span>
        }
        htmlFor="password"
      >
        <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
