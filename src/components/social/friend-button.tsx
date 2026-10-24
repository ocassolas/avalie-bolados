"use client";

import { Check, Clock, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeFriend, respondFriendRequest, sendFriendRequest } from "@/app/actions/social";
import { Button } from "@/components/ui/button";

export type Relation = "none" | "friend" | "outgoing" | "incoming";

export function FriendButton({
  userId,
  username,
  relation: initial,
  friendshipId,
  demo,
  size = "sm",
}: {
  userId: string;
  username: string;
  relation: Relation;
  friendshipId?: string;
  demo?: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [relation, setRelation] = useState(initial);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, next: Relation, confirmMsg?: string) => {
    if (demo) return void toast.info("Modo demonstração: nada é salvo.");
    if (confirmMsg && !confirm(confirmMsg)) return;
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      if (res.message) toast.success(res.message);
      setRelation(next);
      router.refresh();
    });
  };

  if (relation === "friend") {
    return (
      <Button size={size} variant="solid" loading={pending} onClick={() => run(() => removeFriend(userId), "none", `Desfazer amizade com @${username}?`)}>
        <Check className="h-4 w-4" /> Amigos
        <UserMinus className="h-3.5 w-3.5 opacity-50" aria-label="Desfazer" />
      </Button>
    );
  }
  if (relation === "outgoing") {
    return (
      <Button size={size} variant="solid" loading={pending} onClick={() => run(() => removeFriend(userId), "none", "Cancelar o pedido de amizade?")}>
        <Clock className="h-4 w-4" /> Pedido enviado
      </Button>
    );
  }
  if (relation === "incoming") {
    return (
      <div className="flex gap-2">
        <Button
          size={size}
          variant="gold"
          loading={pending}
          onClick={() => run(() => (friendshipId ? respondFriendRequest(friendshipId, true) : sendFriendRequest(username)), "friend")}
        >
          <Check className="h-4 w-4" /> Aceitar
        </Button>
        {friendshipId && (
          <Button size={size} variant="solid" disabled={pending} onClick={() => run(() => respondFriendRequest(friendshipId, false), "none")}>
            Recusar
          </Button>
        )}
      </div>
    );
  }
  return (
    <Button size={size} variant="outline" loading={pending} onClick={() => run(() => sendFriendRequest(username), "outgoing")}>
      <UserPlus className="h-4 w-4" /> Adicionar
    </Button>
  );
}
