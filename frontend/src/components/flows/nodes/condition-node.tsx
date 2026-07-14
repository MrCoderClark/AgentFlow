"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, XCircle } from "lucide-react";

export function ConditionNode({ data }: NodeProps) {
  const d = data as Record<string, string>;
  const isSuccess = d.variant === "success" || d.label?.toLowerCase() === "success";

  return (
    <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-md border border-border/50">
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
      )}
      <p className="text-sm font-medium text-foreground whitespace-nowrap">
        {d.label || (isSuccess ? "Success" : "Failure")}
      </p>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-muted-foreground/40 !border-0" />
    </div>
  );
}
