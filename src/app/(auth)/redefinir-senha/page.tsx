"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePassword } from "@/app/actions/auth";
import { PasswordInput, StrengthMeter } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-[41px]">Nova senha</h1>
      <p className="mt-2 text-muted">Escolha uma senha forte que você não usa em outro lugar.</p>
      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updatePassword({ password, confirm });
            if (!res.ok) {
              setErrors(res.fields ?? {});
              toast.error(res.error);
              return;
            }
            toast.success("Senha atualizada!");
            router.push("/inicio");
          });
        }}
      >
        <Field label="Nova senha" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <StrengthMeter password={password} />
        <Field label="Confirmar nova senha" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
          Salvar senha
        </Button>
      </form>
    </>
  );
}
