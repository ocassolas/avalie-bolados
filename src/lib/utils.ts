import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "America/Sao_Paulo";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, ...opts });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** Chave do dia (AAAA-MM-DD) no fuso de Brasília */
export function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diff < 60) return "agora";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 7) return rtf.format(-Math.round(diff / 86400), "day");
  return formatDate(iso, { day: "2-digit", month: "short" });
}

/** A data ISO aconteceu há menos de N horas? */
export function withinHours(iso: string, hours: number) {
  return Date.now() - new Date(iso).getTime() < hours * 3600_000;
}

/** ISO de N dias atrás. */
export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function typeLabel(t: "tabaco" | "beck" | "mesclado" | "cumbaia") {
  return { tabaco: "Tabaco", beck: "Beck", mesclado: "Mesclado", cumbaia: "Cumbaibeck" }[t];
}

/** Extrai o ID de um link do YouTube para embed sem cookies */
export function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}
