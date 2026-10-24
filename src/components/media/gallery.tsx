"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Play, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteMedia } from "@/app/actions/app";
import type { Media } from "@/lib/types";
import { youtubeId } from "@/lib/utils";

export function MediaGallery({ media, viewerId, isAdmin }: { media: Media[]; viewerId: string; isAdmin: boolean }) {
  const canDelete = (m: Media) => isAdmin || m.uploader_id === viewerId;
  const router = useRouter();
  const [open, setOpen] = useState<Media | null>(null);
  const photos = media.filter((m) => m.kind === "photo" && m.signed_url);
  const videos = media.filter((m) => m.kind !== "photo");

  async function remove(m: Media) {
    if (!confirm("Apagar esta mídia?")) return;
    const res = await deleteMedia(m.id);
    if (!res.ok) return toast.error(res.error);
    setOpen(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((m) => (
            <button key={m.id} type="button" onClick={() => setOpen(m)} className="aspect-square overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.signed_url!} alt={m.caption ?? "Foto do bolado"} className="h-full w-full object-cover transition hover:scale-105" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {videos.map((m) => {
        if (m.kind === "video" && m.signed_url) {
          return (
            <div key={m.id} className="overflow-hidden rounded-xl border border-line bg-black">
              <video src={m.signed_url} controls playsInline preload="metadata" className="max-h-[480px] w-full" />
              {canDelete(m) && (
                <button type="button" onClick={() => remove(m)} className="flex w-full items-center justify-center gap-1 bg-surface py-2 text-xs text-danger">
                  <Trash2 className="h-3.5 w-3.5" /> Apagar vídeo
                </button>
              )}
            </div>
          );
        }
        const yt = m.url ? youtubeId(m.url) : null;
        if (yt) {
          return (
            <div key={m.id} className="overflow-hidden rounded-xl border border-line">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${yt}`}
                  title="Vídeo do bolado"
                  className="h-full w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              {canDelete(m) && (
                <button type="button" onClick={() => remove(m)} className="flex w-full items-center justify-center gap-1 bg-surface py-2 text-xs text-danger">
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </button>
              )}
            </div>
          );
        }
        return (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-2 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-accent">
              <Play className="h-5 w-5" />
            </div>
            <a href={m.url!} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm hover:text-accent">
              {m.caption || m.url}
            </a>
            <ExternalLink className="h-4 w-4 text-faint" />
            {canDelete(m) && (
              <button type="button" onClick={() => remove(m)} aria-label="Remover link" className="text-faint hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}

      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Foto do bolado</Dialog.Title>
            {open?.signed_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.signed_url} alt={open.caption ?? ""} className="max-h-full max-w-full rounded-2xl object-contain" />
            )}
            <div className="absolute right-4 top-4 flex gap-2">
              {open && canDelete(open) && (
                <button type="button" onClick={() => remove(open)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-danger" aria-label="Apagar foto">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <Dialog.Close className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Fechar">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
