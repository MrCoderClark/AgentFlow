"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUpDown, SlidersHorizontal, MessageSquare, Phone, Globe } from "lucide-react";

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

const channelIcons: Record<string, typeof MessageSquare> = {
  widget: MessageSquare,
  phone: Phone,
  web: Globe,
};

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<"all" | "mine">("mine");
  const pathname = usePathname();

  useEffect(() => {
    const params = filter === "mine" ? "?assigned_to_me=true" : "";
    api.get<Conversation[]>(`/api/conversations${params}`).then(setConversations);
  }, [filter]);

  const selectedId = pathname.split("/inbox/")[1];
  const assignedCount = conversations.length;

  return (
    <div className="flex h-full w-[360px] flex-col border-r">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === "mine" ? "all" : "mine")}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              {filter === "mine" ? "Assigned to me" : "All conversations"}
              {filter === "mine" && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {assignedCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded p-1.5 hover:bg-accent">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="rounded p-1.5 hover:bg-accent">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Sorted by Newest conversations</p>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {conversations.map((c) => {
          const ChannelIcon = channelIcons[c.channel] || MessageSquare;
          return (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className={cn(
                "flex gap-3 border-b px-4 py-3 transition-colors hover:bg-accent",
                selectedId === c.id && "border-l-2 border-l-primary bg-accent",
              )}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {(c.subject || "N")[0].toUpperCase()}
              </div>
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{c.subject || "New conversation"}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {relativeTime(c.updated_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.channel === "widget" ? "Hey there, I need help..." : "Message preview"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <ChannelIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{c.channel}</span>
                  {c.priority === "urgent" && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">Urgent</Badge>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {conversations.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No conversations</p>
        )}
      </ScrollArea>
    </div>
  );
}
