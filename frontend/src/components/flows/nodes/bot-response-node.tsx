"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function BotResponseNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  return (
    <div className="min-w-[200px] rounded-lg border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">Bot Response</p>
      <p className="mt-1 text-sm">{d.message || "Message…"}</p>
      {d.collect_as && (
        <p className="mt-1 text-xs text-muted-foreground">Collects: {d.collect_as}</p>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
