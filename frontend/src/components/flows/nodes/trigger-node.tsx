"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function TriggerNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-l-4 border-l-green-500 bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">Trigger</p>
      <p className="text-sm font-semibold">{(data as Record<string, string>).label || "Start"}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
}
