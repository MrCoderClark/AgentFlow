"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    api.get<Conversation[]>("/api/conversations").then(setConversations);
  }, []);

  const selectedId = pathname.split("/inbox/")[1];

  return (
    <div className="flex h-full w-80 flex-col border-r">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Conversations</h2>
      </div>
      <ScrollArea className="flex-1">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/inbox/${c.id}`}
            className={cn(
              "flex flex-col gap-1 border-b px-4 py-3 transition-colors hover:bg-accent",
              selectedId === c.id && "bg-accent",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{c.subject || "New conversation"}</span>
              <Badge variant={c.status === "open" ? "default" : "secondary"} className="text-xs">
                {c.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">{c.channel}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(c.updated_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No conversations yet</p>
        )}
      </ScrollArea>
    </div>
  );
}

export function addConversation(setter: React.Dispatch<React.SetStateAction<Conversation[]>>, conv: Conversation) {
  setter((prev) => [conv, ...prev]);
}
