"use client";

import { applyTheme } from "@/lib/theme-client";
import imageCompression from "browser-image-compression";
import { Camera, Check, Download, Globe, KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { updateEmail, updatePassword } from "@/app/actions/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileStylePicker } from "./style-picker";
import { deleteMyAccount, equipItem, revokeConsent, setAvatarPath, updatePrivacy, updateProfile } from "@/app/actions/app";
import { PasswordInput, StrengthMeter } from "@/components/auth/password-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { Consent } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile, ShopItem } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function Section({ id, title, icon, children, description }: { id?: string; title: string; icon: ReactNode; children: ReactNode; description?: string }) {
  return (
    <section id={id} className="card scroll-mt-20 p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">{icon}</div>
        <div>
          <h2 className="font-display text-[20px] font-bold">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const demoToast = () => toast.info("Modo demonstração: nada é salvo.");

export function ProfileSection({ profile, styleItems, owned, demo }: { profile: Profile; styleItems: ShopItem[]; owned: string[]; demo: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [v, setV] = useState({ display_name: profile.display_name, username: profile.username, bio: profile.bio ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    if (demo) return demoToast();
    setUploading(true);
    try {
      const img = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 512, useWebWorker: true, fileType: "image/webp" });
      const path = `${profile.id}/${crypto.randomUUID()}.webp`;
      const { error } = await supabaseBrowser().storage.from("avatars").upload(path, img, { contentType: "image/webp" });
      if (error) throw new Error("Falha no upload da foto.");
      const res = await setAvatarPath(path);
      if (!res.ok) throw new Error(res.error);
      toast.success("Foto atualizada!");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Section id="perfil" title="Perfil" icon={<Camera className="h-5 w-5" />}>
      <div className="flex items-center gap-5">
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative" aria-label="Trocar foto">
          <Avatar name={profile.display_name} src={profile.avatar_url} frame={profile.active_frame} size="xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </span>
        </button>
        <div className="space-y-2">
          <Button size="sm" variant="solid" loading={uploading} onClick={() => fileRef.current?.click()}>
            Trocar foto
          </Button>
          {profile.avatar_path && (
            <button
              type="button"
              className="block text-xs text-muted hover:text-danger"
              onClick={() =>
                demo
                  ? demoToast()
                  : start(async () => {
                      const r = await setAvatarPath(null);
                      if (!r.ok) toast.error(r.error);
                      router.refresh();
                    })
              }
            >
              Remover foto
            </button>
          )}
          <p className="text-xs text-faint">JPG, PNG ou WebP. Ajustamos o tamanho.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (demo) return demoToast();
          start(async () => {
            const res = await updateProfile(v);
            if (!res.ok) {
              setErrors(res.fields ?? {});
              toast.error(res.error);
              return;
            }
            setErrors({});
            toast.success(res.message ?? "Salvo.");
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="pn" error={errors.display_name}>
            <Input id="pn" value={v.display_name} maxLength={40} onChange={(e) => setV({ ...v, display_name: e.target.value })} />
          </Field>
          <Field label="Usuário" htmlFor="pu" error={errors.username}>
            <Input id="pu" value={v.username} maxLength={20} onChange={(e) => setV({ ...v, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "") })} />
          </Field>
        </div>
        <Field label="Bio" htmlFor="pb" hint={`${v.bio.length}/160`} error={errors.bio}>
          <Textarea id="pb" value={v.bio} maxLength={160} onChange={(e) => setV({ ...v, bio: e.target.value })} className="min-h-20" placeholder="Seu estilo de bolar em uma frase" />
        </Field>
        <Button type="submit" variant="gold" loading={pending}>
          Salvar perfil
        </Button>
      </form>

      <ProfileStylePicker profile={profile} items={styleItems} owned={owned} demo={demo} />
    </Section>
  );
}

export function AppearanceSection({ themes, active, demo }: { themes: ShopItem[]; active: string; demo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Section title="Aparência" icon={<span className="h-4 w-4 rounded-full bg-foil" />} description="Seus temas. Compre outros na loja.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {themes.map((t) => {
          const value = t.data.value!;
          const on = active === value;
          return (
            <button
              key={t.key}
              type="button"
              disabled={pending}
              onClick={() => {
                applyTheme(value);
                if (demo) return demoToast();
                start(async () => {
                  const res = await equipItem("theme", t.key);
                  if (!res.ok) toast.error(res.error);
                  router.refresh();
                });
              }}
              className={cn("rounded-2xl border p-3 text-left transition", on ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-line-strong")}
            >
              <div className="flex h-10 overflow-hidden rounded-lg">
                {(t.data.swatch ?? []).map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 flex items-center justify-between text-sm font-medium">
                {t.name} {on && <Check className="h-4 w-4 text-accent" />}
              </p>
            </button>
          );
        })}
      </div>
      <Link href="/loja" className="mt-4 inline-block text-sm text-accent hover:underline">
        Ver todos os temas na loja →
      </Link>
    </Section>
  );
}

export function PrivacySection({ isPublic, demo }: { isPublic: boolean; demo: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(isPublic);
  const [pending, start] = useTransition();
  return (
    <Section title="Privacidade" icon={<Globe className="h-5 w-5" />}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-medium">Perfil público e ranking global</p>
          <p className="mt-1 text-sm text-muted">
            Desligado (padrão): só quem está nas suas rodas vê seu perfil. Ligado: qualquer pessoa logada vê seu nome, nível,
            conquistas e médias, e você aparece no ranking global. Fotos e avaliações continuam só nas rodas.
          </p>
        </div>
        <Switch
          checked={on}
          disabled={pending}
          label="Perfil público"
          onChange={(v) => {
            setOn(v);
            if (demo) return demoToast();
            start(async () => {
              const res = await updatePrivacy(v);
              if (!res.ok) {
                setOn(!v);
                toast.error(res.error);
                return;
              }
              toast.success(res.message ?? "Salvo.");
              router.refresh();
            });
          }}
        />
      </div>
    </Section>
  );
}

export function AccountSection({ email, demo }: { email: string; demo: boolean }) {
  const [pending, start] = useTransition();
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <Section title="Conta" icon={<KeyRound className="h-5 w-5" />} description={email}>
      <div className="grid gap-8 sm:grid-cols-2">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (demo) return demoToast();
            start(async () => {
              const res = await updateEmail(newEmail);
              if (!res.ok) return void toast.error(res.error);
              toast.success(res.message);
              setNewEmail("");
            });
          }}
        >
          <p className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-muted" /> Trocar e-mail</p>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@email.com" autoComplete="email" />
          <Button type="submit" size="sm" variant="solid" loading={pending} disabled={!newEmail}>
            Enviar confirmação
          </Button>
        </form>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (demo) return demoToast();
            start(async () => {
              const res = await updatePassword(pw);
              if (!res.ok) {
                setErrors(res.fields ?? {});
                return void toast.error(res.error);
              }
              setErrors({});
              setPw({ password: "", confirm: "" });
              toast.success("Senha atualizada.");
            });
          }}
        >
          <p className="flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4 text-muted" /> Trocar senha</p>
          <PasswordInput value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} placeholder="Nova senha" autoComplete="new-password" aria-invalid={!!errors.password} />
          <StrengthMeter password={pw.password} />
          <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Confirmar nova senha" autoComplete="new-password" aria-invalid={!!errors.confirm} />
          {(errors.password || errors.confirm) && <p className="text-xs text-danger">{errors.password || errors.confirm}</p>}
          <Button type="submit" size="sm" variant="solid" loading={pending} disabled={!pw.password}>
            Salvar senha
          </Button>
        </form>
      </div>
      <div className="mt-6 border-t border-line pt-5">
        <SignOutButton className="-ml-3" />
      </div>
    </Section>
  );
}

const CONSENT_LABEL = { terms: "Termos de Uso", privacy: "Política de Privacidade", sensitive_data: "Tratamento de dados sensíveis" };

export function DataSection({ consents, demo }: { consents: Consent[]; demo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const active = consents.filter((c) => !c.revoked_at);

  return (
    <Section title="Meus dados (LGPD)" icon={<ShieldCheck className="h-5 w-5" />} description="Seus direitos como titular, direto no app.">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium">Consentimentos registrados</p>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {consents.length === 0 && <li className="p-3 text-sm text-muted">Nenhum registro.</li>}
            {consents.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p>{CONSENT_LABEL[c.kind]}</p>
                  <p className="text-xs text-faint">
                    versão {c.version} · aceito em {formatDate(c.granted_at)}
                    {c.revoked_at && <> · <span className="text-danger">revogado em {formatDate(c.revoked_at)}</span></>}
                  </p>
                </div>
                {!c.revoked_at && c.kind === "sensitive_data" && (
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-danger"
                    onClick={() => {
                      if (demo) return demoToast();
                      if (!confirm("Sem esse consentimento o app não consegue guardar suas avaliações e fotos. Revogar e seguir para a exclusão da conta?")) return;
                      start(async () => {
                        const r = await revokeConsent("sensitive_data");
                        if (!r.ok) return void toast.error(r.error);
                        setShowDelete(true);
                        router.refresh();
                      });
                    }}
                  >
                    Revogar
                  </button>
                )}
              </li>
            ))}
          </ul>
          {active.length < 3 && consents.length > 0 && (
            <p className="mt-2 text-xs text-ember">Há consentimento revogado. Recomendamos excluir sua conta ou falar com o responsável pelo app.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="solid" className="flex-1">
            <a href="/api/me/export" download>
              <Download className="h-4 w-4" /> Exportar meus dados (JSON)
            </a>
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setShowDelete((s) => !s)}>
            <Trash2 className="h-4 w-4" /> Excluir minha conta
          </Button>
        </div>

        {showDelete && (
          <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
            <p className="font-medium text-danger">Excluir conta para sempre</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Apagamos seu perfil, seus bolados, as avaliações que você fez e as fotos que você enviou.</li>
              <li>Rodas que você criou passam para o membro mais antigo (ou são apagadas se ficarem vazias).</li>
              <li>Não dá para desfazer. Se quiser uma cópia, exporte antes.</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Digite EXCLUIR" aria-label="Confirmação" />
              <Button
                variant="danger"
                loading={pending}
                disabled={confirmText.trim().toUpperCase() !== "EXCLUIR"}
                onClick={() => {
                  if (demo) return demoToast();
                  start(async () => {
                    const r = await deleteMyAccount(confirmText);
                    if (!r.ok) return void toast.error(r.error);
                    toast.success("Conta excluída. Valeu pela resenha.");
                    router.push("/");
                    router.refresh();
                  });
                }}
              >
                Excluir agora
              </Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
