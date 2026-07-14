"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function ConditionNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  return (
    <div className="min-w-[180px] rounded-lg border-l-4 border-l-yellow-500 bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">Condition</p>
      <p className="mt-1 text-sm font-medium">{d.field || "Check field"}</p>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="success" className="!left-1/3 !bg-green-500" />
      <Handle type="source" position={Position.Bottom} id="failure" className="!left-2/3 !bg-red-500" />
    </div>
  );
}
