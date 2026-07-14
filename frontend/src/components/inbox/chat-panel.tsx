"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { MessageBubble } from "./message-bubble";
import { ReplyBox } from "./reply-box";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Users, ChevronDown, MessageSquare } from "lucide-react";

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
    <div className="flex flex-1 flex-col bg-background">
      {/* Conversation header bar — matches Design-Backend */}
      <div className="flex items-center justify-between border-b bg-card px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{conversation.subject || "New conversation"}</h3>
            <p className="text-[11px] text-muted-foreground">via {conversation.channel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
            <Users className="h-3.5 w-3.5" />
            Group
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
            <Users className="h-3.5 w-3.5" />
            {conversation.assigned_agent_id ? "Mike..." : "Assign"}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button size="sm" className="h-8 w-8 bg-primary hover:bg-primary/90 p-0">
            <Check className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply box */}
      <ReplyBox onSend={onSend} />
    </div>
  );
}
