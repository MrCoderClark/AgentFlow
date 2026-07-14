"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Send } from "lucide-react";

export function BotResponseNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-md border border-border/50">
      <Send className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm font-medium text-foreground whitespace-nowrap">
        {d.label || "Bot response"}
      </p>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
      {/* Blue dot handle on the right */}
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-blue-400 !border-2 !border-blue-200 !rounded-full" />
    </div>
  );
}
