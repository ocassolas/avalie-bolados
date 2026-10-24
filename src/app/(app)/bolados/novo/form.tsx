"use client";

import { AlertTriangle, Camera, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { createBolado } from "@/app/actions/app";
import { uploadBoladoFile } from "@/components/media/uploader";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ConeArt, TypeChip } from "@/components/ui/misc";
import { CONTENTS, CONTENT_GROUPS, FILTERS, PAPERS, PAPER_SIZES, TYPE_INFO, deriveType } from "@/lib/contents";
import type { ProfileLite } from "@/lib/types";
import { cn } from "@/lib/utils";

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function Chip({ on, onClick, children, hint }: { on: boolean; onClick: () => void; children: ReactNode; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[.98]",
        on ? "border-accent/70 bg-accent/10 text-fg" : "border-line bg-bg-2 text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border", on ? "border-accent bg-accent text-accent-fg" : "border-line-strong")}>
        {on && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium leading-tight">{children}</span>
        {hint && <span className="block text-[11px] leading-tight text-faint">{hint}</span>}
      </span>
    </button>
  );
}

/** Escolha única em pílulas, com opção "Outro" em texto livre. */
function PickOne({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const isOther = value !== "" && !options.includes(value);
  const [other, setOther] = useState(isOther);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              setOther(false);
              onChange(value === o ? "" : o);
            }}
            aria-pressed={value === o}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              value === o ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {o}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setOther(true);
            if (options.includes(value)) onChange("");
          }}
          aria-pressed={other}
          className={cn("rounded-full border px-3 py-1.5 text-sm transition", other ? "border-accent bg-accent/10 text-accent" : "border-dashed border-line-strong text-muted hover:text-fg")}
        >
          Outro
        </button>
      </div>
      {other && <Input className="mt-2 h-11" value={value} maxLength={60} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus />}
    </div>
  );
}

export function NewBoladoForm({
  rodas,
  members,
  viewerId,
  defaultRoda,
  demo,
}: {
  rodas: { id: string; name: string }[];
  members: Record<string, ProfileLite[]>;
  viewerId: string;
  defaultRoda: string;
  demo: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [rodaId, setRodaId] = useState(defaultRoda);
  const [rollerId, setRollerId] = useState(viewerId);
  const [contents, setContents] = useState<string[]>([]);
  const [mix, setMix] = useState(50);
  const [weight, setWeight] = useState("");
  const [rolledAt, setRolledAt] = useState(nowLocal);
  const [paper, setPaper] = useState("");
  const [paperSize, setPaperSize] = useState("");
  const [filter, setFilter] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);

  const people = members[rodaId] ?? [];
  const type = deriveType(contents);
  const onlyAdditives = contents.length > 0 && type === null;

  function changeRoda(id: string) {
    setRodaId(id);
    const list = members[id] ?? [];
    if (!list.some((p) => p.id === rollerId)) setRollerId(list[0]?.id ?? viewerId);
  }
  const toggle = (key: string) => setContents((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));

  const previews = useMemo(() => files.map((f) => ({ f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) {
      toast.error(contents.length ? "Falta a base: tabaco, flor/extração ou ervas." : "Marque o que tem dentro do bolado.");
      document.getElementById("conteudo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    start(async () => {
      if (demo) {
        toast.info("Modo demonstração: abrindo um bolado de exemplo.");
        router.push("/bolados/b-2");
        return;
      }
      const w = weight ? Number(weight.replace(",", ".")) : null;
      const res = await createBolado({
        roda_id: rodaId,
        roller_id: rollerId,
        contents,
        mix_tobacco_pct: type === "mesclado" ? mix : null,
        weight_g: w && Number.isFinite(w) ? w : null,
        rolled_at: new Date(rolledAt).toISOString(),
        paper,
        paper_size: paperSize,
        filter,
        notes,
      });
      if (!res.ok) return void toast.error(res.error);
      const id = res.data!.id;
      for (let i = 0; i < files.length; i++) {
        setProgress(`Enviando mídia ${i + 1} de ${files.length}…`);
        try {
          await uploadBoladoFile(files[i]!, rodaId, id);
        } catch (err) {
          toast.error((err as Error).message);
        }
      }
      setProgress(null);
      toast.success("Bolado registrado! +XP para quem bolou.");
      router.push(rollerId === viewerId ? `/bolados/${id}` : `/bolados/${id}/avaliar`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Conteúdo */}
      <section id="conteudo" className="card scroll-mt-20 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-line p-5">
          <ConeArt type={type ?? "tabaco"} className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-bold">O que tem dentro?</p>
            {type ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                É um <TypeChip type={type} /> <span className="text-xs">{TYPE_INFO[type].hint}</span>
              </p>
            ) : onlyAdditives ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ember">
                <AlertTriangle className="h-4 w-4" /> Falta a base: tabaco, flor/extração ou ervas.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Marque tudo o que foi pra seda. O tipo se define sozinho.</p>
            )}
          </div>
        </div>
        <div className="space-y-5 p-5">
          {CONTENT_GROUPS.map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-[13px] font-semibold text-muted">
                {g.title} <span className="font-normal normal-case tracking-normal text-faint">· {g.text}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CONTENTS.filter((c) => c.group === g.group).map((c) => (
                  <Chip key={c.key} on={contents.includes(c.key)} onClick={() => toggle(c.key)} hint={c.hint}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}

          {type === "mesclado" && (
            <div className="rounded-2xl border border-ember/30 bg-ember/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Proporção da mistura</span>
                <span className="font-mono text-xs tabular text-muted">
                  {mix}% tabaco · {100 - mix}% flor/extração
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={95}
                step={5}
                value={mix}
                onChange={(e) => setMix(Number(e.target.value))}
                className="w-full accent-[var(--ember)]"
                aria-label="Porcentagem de tabaco na mistura"
              />
              <div className="mt-1 flex h-2 overflow-hidden rounded-full">
                <span className="bg-accent" style={{ width: `${mix}%` }} />
                <span className="flex-1 bg-leaf" />
              </div>
            </div>
          )}

          <Field label="Peso aproximado (opcional)" htmlFor="weight" hint="Em gramas, se alguém pesou.">
            <div className="relative max-w-40">
              <Input id="weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 5))} placeholder="0,8" className="pr-10" />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-faint">g</span>
            </div>
          </Field>
        </div>
      </section>

      {/* Quem, quando */}
      <div className="card space-y-5 p-5">
        {rodas.length > 1 && (
          <Field label="Roda" htmlFor="roda">
            <Select id="roda" value={rodaId} onChange={(e) => changeRoda(e.target.value)}>
              {rodas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Quem bolou?</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRollerId(p.id)}
                aria-pressed={rollerId === p.id}
                className={cn(
                  "flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2 transition",
                  rollerId === p.id ? "border-accent bg-accent/10" : "border-line hover:border-line-strong",
                )}
              >
                <Avatar name={p.display_name} src={p.avatar_url} frame={p.active_frame} size="md" />
                <span className="w-full truncate text-center text-xs">{p.id === viewerId ? "Eu" : p.display_name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Dia e hora" htmlFor="rolled_at" hint="O registro digital do bolado: fica no histórico com data e hora.">
          <Input suppressHydrationWarning id="rolled_at" type="datetime-local" value={rolledAt} max={nowLocal()} onChange={(e) => setRolledAt(e.target.value)} required />
        </Field>
      </div>

      {/* Seda e piteira */}
      <div className="card space-y-5 p-5">
        <div>
          <p className="mb-2 text-sm font-medium">Seda / papel</p>
          <PickOne options={PAPERS} value={paper} onChange={setPaper} placeholder="Qual seda?" />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Tamanho</p>
          <PickOne options={PAPER_SIZES} value={paperSize} onChange={setPaperSize} placeholder="Qual tamanho?" />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Piteira / filtro</p>
          <PickOne options={FILTERS} value={filter} onChange={setFilter} placeholder="Qual piteira?" />
        </div>
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Strain, origem, técnica, qualquer detalhe pra roda saber." />
        </Field>
      </div>

      {/* Mídia */}
      <div className="card p-5">
        <p className="mb-3 text-sm font-medium">Fotos e vídeos</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => {
            setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, 8));
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-4 gap-2">
          {previews.map(({ f, url }, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-line">
              {f.type.startsWith("video/") ? (
                <video src={url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                aria-label="Remover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {files.length < 8 && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-xs text-muted hover:border-accent hover:text-fg"
            >
              <Camera className="h-5 w-5 text-accent" /> Adicionar
            </button>
          )}
        </div>
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full" loading={pending}>
        {progress ?? (type ? `Registrar ${TYPE_INFO[type].label.toLowerCase()}` : "Registrar bolado")}
      </Button>
    </form>
  );
}
