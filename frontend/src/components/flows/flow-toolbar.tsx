"use client";

import { type DragEvent } from "react";

const nodeTypes = [
  { type: "trigger", label: "Trigger", color: "border-l-green-500" },
  { type: "bot_response", label: "Bot Response", color: "border-l-gray-400" },
  { type: "condition", label: "Condition", color: "border-l-yellow-500" },
  { type: "action", label: "Action", color: "border-l-blue-500" },
];

export function FlowToolbar() {
  function onDragStart(e: DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="w-48 space-y-2 border-r p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Nodes</p>
      {nodeTypes.map(({ type, label, color }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          className={`cursor-grab rounded-md border-l-4 ${color} bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
