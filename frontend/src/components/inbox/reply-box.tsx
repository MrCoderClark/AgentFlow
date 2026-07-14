"use client";

import { useState } from "react";
import { Send, Paperclip, Image, BookOpen, Mail, Smile, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReplyBoxProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ReplyBox({ onSend, disabled }: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"reply" | "note">("reply");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent("");
  }

  return (
    <div className="border-t">
      {/* Reply / Private Note tabs */}
      <div className="flex border-b px-4">
        <button
          onClick={() => setTab("reply")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "reply"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reply
        </button>
        <button
          onClick={() => setTab("note")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "note"
              ? "border-yellow-500 text-yellow-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Private Note
        </button>
      </div>
      {/* Text area */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tab === "reply" ? 'Start with a "/" to add a Canned Response' : "Add a private note…"}
          className={`w-full resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none ${
            tab === "note" ? "bg-yellow-50" : ""
          }`}
          rows={3}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        {/* Toolbar */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-1">
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <Image className="h-4 w-4 text-muted-foreground" />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-accent">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Button type="submit" size="sm" disabled={disabled || !content.trim()} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
