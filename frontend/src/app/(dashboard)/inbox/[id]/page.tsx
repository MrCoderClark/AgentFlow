"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAgentWebSocket } from "@/lib/ws";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatPanel } from "@/components/inbox/chat-panel";
import { ContactInfoPanel } from "@/components/inbox/contact-info-panel";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { agent } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const { lastMessage, send } = useAgentWebSocket(agent?.org_id, token);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [incomingMessage, setIncomingMessage] = useState<Message | null>(null);

  useEffect(() => {
    api.get<Conversation>(`/api/conversations/${id}`).then(setConversation);
  }, [id]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "new_message" && lastMessage.conversation_id === id) {
      setIncomingMessage({
        id: crypto.randomUUID(),
        conversation_id: id,
        sender_type: lastMessage.sender_type as Message["sender_type"],
        sender_id: "",
        content: lastMessage.content as string,
        message_type: "text",
        created_at: new Date().toISOString(),
      });
    }
  }, [lastMessage, id]);

  function handleSend(content: string) {
    send({ action: "message", conversation_id: id, content });
    api.post(`/api/conversations/${id}/messages`, { content, sender_type: "agent" });
  }

  return (
    <div className="flex h-full">
      <ConversationList />
      <ChatPanel conversationId={id} onSend={handleSend} incomingMessage={incomingMessage} />
      {conversation?.contact_id && <ContactInfoPanel contactId={conversation.contact_id} />}
    </div>
  );
}
