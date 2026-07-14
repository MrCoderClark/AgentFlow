"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

export function ActionNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-md border border-border/50">
      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
      <p className="text-sm font-medium text-foreground whitespace-nowrap">
        {d.action_type || d.label || "Action"}
      </p>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
    </div>
  );
}
