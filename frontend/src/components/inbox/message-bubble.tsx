import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender_type === "agent";
  const isContact = message.sender_type === "contact";

  return (
    <div className={cn("flex gap-2", isAgent ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isContact
            ? "bg-emerald-100 text-emerald-700"
            : isAgent
              ? "bg-blue-100 text-blue-700"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isContact ? "C" : isAgent ? "A" : "B"}
      </div>
      {/* Message */}
      <div className={cn("max-w-[65%]", isAgent && "text-right")}>
        <p className="mb-0.5 text-xs text-muted-foreground">
          {isContact ? "Customer" : isAgent ? "You" : "Bot"}
        </p>
        <div
          className={cn(
            "inline-block rounded-xl px-4 py-2.5 text-sm leading-relaxed",
            isContact
              ? "rounded-bl-sm bg-emerald-500 text-white"
              : isAgent
                ? "rounded-br-sm bg-card border text-card-foreground"
                : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
