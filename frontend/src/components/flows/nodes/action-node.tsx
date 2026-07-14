"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function ActionNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  return (
    <div className="min-w-[180px] rounded-lg border-l-4 border-l-blue-500 bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">Action</p>
      <p className="mt-1 text-sm font-medium">{d.action_type || "Action"}</p>
      {d.message && <p className="mt-1 text-xs text-muted-foreground">{d.message}</p>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
