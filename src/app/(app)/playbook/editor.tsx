"use client";

import imageCompression from "browser-image-compression";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deletePlaybook, savePlaybook } from "@/app/actions/social";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FILTERS, PAPERS, PAPER_SIZES } from "@/lib/contents";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Playbook } from "@/lib/types";

const STYLES = ["Cone", "Cilindro", "Tulipa", "Twist", "Charuto / Blunt", "Cross", "Cone duplo"];

type StepDraft = { key: string; title: string; body: string; media_path: string | null; preview: string | null };

const newKey = () => Math.random().toString(36).slice(2);
const blankStep = (): StepDraft => ({ key: newKey(), title: "", body: "", media_path: null, preview: null });

export function PlaybookEditor({ userId, initial, demo }: { userId: string; initial: Playbook | null; demo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState<string | null>(null);
  const [v, setV] = useState({
    style: initial?.style ?? "",
    intro: initial?.intro ?? "",
    tips: initial?.tips ?? "",
    favorite_paper: initial?.favorite_paper ?? "",
    favorite_filter: initial?.favorite_filter ?? "",
    favorite_size: initial?.favorite_size ?? "",
    time_minutes: initial?.time_minutes ? String(initial.time_minutes) : "",
  });
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps.length
      ? initial.steps.map((s) => ({ key: s.id, title: s.title, body: s.body ?? "", media_path: s.media_path, preview: s.media_url ?? null }))
      : [blankStep(), blankStep(), blankStep()],
  );

  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));
  const patch = (key: string, p: Partial<StepDraft>) => setSteps((all) => all.map((s) => (s.key === key ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) =>
    setSteps((all) => {
      const j = i + d;
      if (j < 0 || j >= all.length) return all;
      const copy = [...all];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });

  async function upload(key: string, file: File | undefined) {
    if (!file) return;
    if (demo) return void toast.info("Modo demonstração: upload desligado.");
    setUploading(key);
    try {
      const img = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1600, useWebWorker: true, fileType: "image/webp" });
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const { error } = await supabaseBrowser().storage.from("playbooks").upload(path, img, { contentType: "image/webp" });
      if (error) throw new Error("Falha no upload da foto.");
      patch(key, { media_path: path, preview: URL.createObjectURL(img) });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const filled = steps.filter((s) => s.title.trim() || s.body.trim() || s.media_path);
    if (filled.some((s) => !s.title.trim())) return void toast.error("Todo passo precisa de um título.");
    if (!filled.length) return void toast.error("Adicione pelo menos um passo.");
    if (demo) return void toast.info("Modo demonstração: nada é salvo.");
    start(async () => {
      const res = await savePlaybook({
        ...v,
        time_minutes: v.time_minutes ? Number(v.time_minutes) : null,
        steps: filled.map((s) => ({ title: s.title, body: s.body, media_path: s.media_path })),
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Salvo!");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estilo" htmlFor="style">
            <Input id="style" list="styles" value={v.style} maxLength={40} onChange={(e) => set("style", e.target.value)} placeholder="Ex.: Cone" />
            <datalist id="styles">{STYLES.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Tempo médio (min)" htmlFor="time">
            <Input id="time" inputMode="numeric" value={v.time_minutes} onChange={(e) => set("time_minutes", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="5" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Seda favorita" htmlFor="fp">
            <Select id="fp" value={v.favorite_paper} onChange={(e) => set("favorite_paper", e.target.value)}>
              <option value="">—</option>
              {PAPERS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Tamanho" htmlFor="fs">
            <Select id="fs" value={v.favorite_size} onChange={(e) => set("favorite_size", e.target.value)}>
              <option value="">—</option>
              {PAPER_SIZES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Piteira" htmlFor="ff">
            <Select id="ff" value={v.favorite_filter} onChange={(e) => set("favorite_filter", e.target.value)}>
              <option value="">—</option>
              {FILTERS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Apresentação" htmlFor="intro" hint={`${v.intro.length}/500`}>
          <Textarea id="intro" value={v.intro} maxLength={500} onChange={(e) => set("intro", e.target.value)} placeholder="Qual é o seu estilo? O que faz o seu bolado ser seu?" />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold">Passo a passo</h2>
        {steps.map((s, i) => (
          <div key={s.key} className="card space-y-3 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-sm font-bold text-accent-fg">{i + 1}</span>
              <Input value={s.title} maxLength={80} onChange={(e) => patch(s.key, { title: e.target.value })} placeholder={["Dichava", "Monta a piteira", "Carrega a seda", "Enrola e cola"][i] ?? "Título do passo"} aria-label={`Título do passo ${i + 1}`} />
              <div className="flex shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-9 w-8 items-center justify-center text-muted disabled:opacity-30" aria-label="Subir passo">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="flex h-9 w-8 items-center justify-center text-muted disabled:opacity-30" aria-label="Descer passo">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setSteps((all) => all.filter((x) => x.key !== s.key))} disabled={steps.length === 1} className="flex h-9 w-8 items-center justify-center text-danger disabled:opacity-30" aria-label="Remover passo">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Textarea value={s.body} maxLength={600} onChange={(e) => patch(s.key, { body: e.target.value })} placeholder="Explique como faz, o que evitar, o macete." className="min-h-20" aria-label={`Explicação do passo ${i + 1}`} />
            {s.preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.preview} alt="" className="max-h-56 w-full rounded-xl object-cover" />
                <button type="button" onClick={() => patch(s.key, { media_path: null, preview: null })} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white" aria-label="Remover foto">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-3 text-[14px] text-muted hover:text-fg">
                {uploading === s.key ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <ImagePlus className="h-4 w-4 text-accent" />}
                Foto do passo (opcional)
                <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(s.key, e.target.files?.[0])} />
              </label>
            )}
          </div>
        ))}
        {steps.length < 20 && (
          <Button type="button" variant="solid" className="w-full" onClick={() => setSteps((all) => [...all, blankStep()])}>
            <Plus className="h-4 w-4" /> Adicionar passo
          </Button>
        )}
      </section>

      <section className="card p-5">
        <Field label="Dica de quem manja" htmlFor="tips" hint={`${v.tips.length}/1000`}>
          <Textarea id="tips" value={v.tips} maxLength={1000} onChange={(e) => set("tips", e.target.value)} placeholder="O segredo que você só conta pra roda." />
        </Field>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" variant="gold" size="lg" className="flex-1" loading={pending} disabled={!!uploading}>
          Salvar playbook
        </Button>
        {initial && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={pending}
            onClick={() => {
              if (demo) return void toast.info("Modo demonstração.");
              if (!confirm("Apagar seu playbook e as fotos dele?")) return;
              start(async () => {
                const res = await deletePlaybook();
                if (!res.ok) return void toast.error(res.error);
                toast.success("Playbook apagado.");
                router.refresh();
              });
            }}
          >
            Apagar
          </Button>
        )}
      </div>
    </form>
  );
}
