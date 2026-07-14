import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { CheckCheck } from "lucide-react";

export function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender_type === "agent";
  const isContact = message.sender_type === "contact";
  const isBot = message.sender_type === "bot";

  return (
    <div className={cn("flex gap-2.5", isAgent ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isContact && "bg-primary/15 text-primary",
          isAgent && "bg-amber-100 text-amber-700",
          isBot && "bg-muted text-muted-foreground",
        )}
      >
        {isContact ? "C" : isAgent ? "A" : "B"}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[60%]")}>
        <p className={cn("mb-1 text-xs text-muted-foreground", isAgent && "text-right")}>
          {isContact ? "Customer" : isAgent ? "You" : "Bot"}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
            isContact && "rounded-bl-sm bg-primary text-primary-foreground",
            isAgent && "rounded-br-sm bg-card border border-border text-card-foreground",
            isBot && "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={cn("mt-1 flex items-center gap-1", isAgent ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
          {isAgent && <CheckCheck className="h-3 w-3 text-primary" />}
        </div>
      </div>
    </div>
  );
}
