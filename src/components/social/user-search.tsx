"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { searchUsers } from "@/app/actions/social";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/field";
import type { UserSearchResult } from "@/lib/types";
import { FriendButton } from "./friend-button";

/** Busca de pessoas pelo @, com botão de adicionar em cada resultado. */
export function UserSearch({ demo }: { demo?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim().replace(/^@/, "");
    if (term.length < 2 || demo) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await searchUsers(term);
      if (id !== seq.current) return;
      setLoading(false);
      setResults(res.ok ? (res.data ?? []) : []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, demo]);

  const term = q.trim().replace(/^@/, "");
  return (
    <div className="card p-5">
      <p className="text-[17px] font-semibold">Adicionar amigos</p>
      <p className="mt-1 text-[13px] text-muted">Procure pelo @ da pessoa.</p>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value.toLowerCase())}
          placeholder="@usuario"
          autoCapitalize="none"
          autoComplete="off"
          className="pl-10"
          aria-label="Buscar pelo @"
        />
      </div>
      {demo && term.length >= 2 && <p className="mt-3 text-[13px] text-muted">Modo demonstração: a busca fica desligada.</p>}
      {!demo && term.length >= 2 && (
        <ul className="mt-3 space-y-1">
          {loading && !results && <li className="skeleton h-12" />}
          {results?.length === 0 && !loading && <li className="py-3 text-center text-[13px] text-muted">Ninguém com esse @.</li>}
          {results?.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl p-2">
              <Link href={`/perfil/${r.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={r.display_name} src={r.avatar_url} frame={r.active_frame} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{r.display_name}</p>
                  <p className="truncate text-[13px] text-muted">@{r.username} · Nv. {r.level}</p>
                </div>
              </Link>
              <FriendButton userId={r.id} username={r.username} relation={r.relation} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
