"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function TriggerNode({ data }: NodeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-md border border-border/50">
      <p className="text-sm font-medium text-foreground whitespace-nowrap">
        {(data as Record<string, string>).label || "Create ticket"}
      </p>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
    </div>
  );
}
