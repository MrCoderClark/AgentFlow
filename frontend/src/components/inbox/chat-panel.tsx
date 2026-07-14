"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { MessageBubble } from "./message-bubble";
import { ReplyBox } from "./reply-box";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Users, User } from "lucide-react";

interface ChatPanelProps {
  conversation: Conversation;
  onSend: (content: string) => void;
  incomingMessage: Message | null;
}

export function ChatPanel({ conversation, onSend, incomingMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Message[]>(`/api/conversations/${conversation.id}/messages`).then(setMessages);
  }, [conversation.id]);

  useEffect(() => {
    if (incomingMessage && incomingMessage.conversation_id === conversation.id) {
      setMessages((prev) => [...prev, incomingMessage]);
    }
  }, [incomingMessage, conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Conversation header — matches design */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">{conversation.subject || "New conversation"}</h3>
          <p className="text-xs text-muted-foreground">via {conversation.channel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            Group
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <User className="h-3.5 w-3.5" />
            {conversation.assigned_agent_id ? "Assigned" : "Unassigned"}
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-5">
        <div className="space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply box with tabs + toolbar */}
      <ReplyBox onSend={onSend} />
    </div>
  );
}
