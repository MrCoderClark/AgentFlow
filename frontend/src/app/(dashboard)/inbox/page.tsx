"use client";

import { ConversationList } from "@/components/inbox/conversation-list";

export default function InboxPage() {
  return (
    <div className="flex h-full">
      <ConversationList />
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a conversation to start
      </div>
    </div>
  );
}
