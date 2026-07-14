import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender_type === "agent";
  const isBot = message.sender_type === "bot";

  return (
    <div className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 text-sm",
          isAgent
            ? "bg-primary text-primary-foreground"
            : isBot
              ? "bg-muted text-muted-foreground"
              : "bg-card border text-card-foreground",
        )}
      >
        <p className="text-xs font-medium mb-1 opacity-70">
          {isAgent ? "Agent" : isBot ? "Bot" : "Customer"}
        </p>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="text-[10px] mt-1 opacity-50">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
