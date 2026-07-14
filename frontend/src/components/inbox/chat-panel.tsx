"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Message } from "@/types";
import { MessageBubble } from "./message-bubble";
import { ReplyBox } from "./reply-box";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  conversationId: string;
  onSend: (content: string) => void;
  incomingMessage: Message | null;
}

export function ChatPanel({ conversationId, onSend, incomingMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Message[]>(`/api/conversations/${conversationId}/messages`).then(setMessages);
  }, [conversationId]);

  useEffect(() => {
    if (incomingMessage && incomingMessage.conversation_id === conversationId) {
      setMessages((prev) => [...prev, incomingMessage]);
    }
  }, [incomingMessage, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <ReplyBox onSend={onSend} />
    </div>
  );
}
