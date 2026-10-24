"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function RecuperarSenhaPage() {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);

  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-[41px]">Esqueceu a senha?</h1>
      <p className="mt-2 text-muted">Sem estresse. Mandamos um link para você criar outra.</p>
      {done ? (
        <div className="card mt-8 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-accent" />
          <p className="mt-3 text-sm text-muted">{done}</p>
        </div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await requestPasswordReset(email);
              if (!res.ok) toast.error(res.error);
              else setDone(res.message ?? "Enviado.");
            });
          }}
        >
          <Field label="E-mail da conta" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
            Enviar link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/entrar" className="hover:text-accent">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
