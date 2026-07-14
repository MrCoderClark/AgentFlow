"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Conversation } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUpDown, SlidersHorizontal, Sparkles, MessageSquare, Phone, Globe, CornerUpLeft, Tag } from "lucide-react";

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
  const count = conversations.length;

  return (
    <div className="flex h-full w-[380px] flex-col border-r bg-card">
      {/* Filter header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setFilter(filter === "mine" ? "all" : "mine")}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            {filter === "mine" ? "Assigned to me" : "All conversations"}
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {count}
            </span>
          </button>
          <div className="flex items-center gap-0.5">
            <button className="rounded p-1.5 hover:bg-accent"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /></button>
            <button className="rounded p-1.5 hover:bg-accent"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sorted by Newest conversations</span>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {conversations.map((c) => {
          const ChannelIcon = channelIcons[c.channel] || MessageSquare;
          const selected = selectedId === c.id;
          return (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className={cn(
                "relative flex gap-3 border-b px-4 py-3.5 transition-colors hover:bg-accent/50",
                selected && "bg-accent/60",
              )}
            >
              {/* Teal left border on selected */}
              {selected && <div className="absolute left-0 top-0 h-full w-[3px] bg-primary rounded-r" />}

              {/* Avatar circle */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(c.subject || "N")[0].toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground truncate">{c.subject || "New conversation"}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">{relativeTime(c.updated_at)}</span>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground leading-snug">
                  Hey there, I see that you had p...
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{c.channel === "widget" ? "Order cancellation" : c.channel}</span>
                  </div>
                  {selected && <CornerUpLeft className="h-3.5 w-3.5 text-primary ml-auto" />}
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
