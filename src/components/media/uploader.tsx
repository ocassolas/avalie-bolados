"use client";

import imageCompression from "browser-image-compression";
import { ImagePlus, Link2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addMediaLink, registerMedia } from "@/app/actions/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { supabaseBrowser } from "@/lib/supabase/client";

const MAX_VIDEO = 50 * 1024 * 1024;

/** Comprime (se imagem) e sobe um arquivo para media/{roda}/{bolado}/; devolve o caminho. */
export async function uploadBoladoFile(file: File, rodaId: string, boladoId: string) {
  const isVideo = file.type.startsWith("video/");
  if (isVideo && file.size > MAX_VIDEO) throw new Error("Vídeo acima de 50 MB. Envie um mais curto ou cole um link.");
  const body = isVideo
    ? file
    : await imageCompression(file, { maxSizeMB: 1.2, maxWidthOrHeight: 2000, useWebWorker: true, fileType: "image/webp" });
  const ext = isVideo ? (file.name.split(".").pop()?.toLowerCase() ?? "mp4") : "webp";
  const path = `${rodaId}/${boladoId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseBrowser()
    .storage.from("media")
    .upload(path, body, { contentType: isVideo ? file.type : "image/webp", upsert: false });
  if (error) throw new Error("Falha no upload. Tente de novo.");
  const res = await registerMedia({ bolado_id: boladoId, roda_id: rodaId, kind: isVideo ? "video" : "photo", storage_path: path });
  if (!res.ok) throw new Error(res.error);
  return path;
}

export function MediaUploader({ rodaId, boladoId, demo }: { rodaId: string; boladoId: string; demo?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [link, setLink] = useState("");
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    if (demo) return toast.info("Modo demonstração: upload desligado.");
    const list = Array.from(files).slice(0, 8);
    setBusy(list.length);
    let ok = 0;
    for (const f of list) {
      try {
        await uploadBoladoFile(f, rodaId, boladoId);
        ok++;
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (ok) toast.success(ok === 1 ? "Mídia enviada! +5 XP" : `${ok} arquivos enviados!`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy > 0}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-bg-2/60 px-4 py-6 text-sm text-muted transition hover:border-accent hover:text-fg disabled:opacity-60"
      >
        {busy > 0 ? <Loader2 className="h-6 w-6 animate-spin text-accent" /> : <ImagePlus className="h-6 w-6 text-accent" />}
        {busy > 0 ? `Enviando ${busy}…` : "Adicionar fotos ou vídeos"}
        <span className="text-xs text-faint">Fotos são comprimidas. Vídeos até 50 MB.</span>
      </button>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (demo) return toast.info("Modo demonstração: links desligados.");
          start(async () => {
            const res = await addMediaLink({ bolado_id: boladoId, url: link });
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success(res.message ?? "Adicionado.");
            setLink("");
            router.refresh();
          });
        }}
      >
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link do YouTube, Instagram ou TikTok" className="h-11 pl-10 text-sm" />
        </div>
        <Button type="submit" size="md" variant="solid" loading={pending} disabled={!link}>
          Colar
        </Button>
      </form>
    </div>
  );
}
