"use client";

import { useCallback, type DragEvent } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  type Connection,
  type Edge,
  type Node,
  type DefaultEdgeOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TriggerNode } from "./nodes/trigger-node";
import { BotResponseNode } from "./nodes/bot-response-node";
import { ConditionNode } from "./nodes/condition-node";
import { ActionNode } from "./nodes/action-node";

const nodeTypes = {
  trigger: TriggerNode,
  bot_response: BotResponseNode,
  condition: ConditionNode,
  action: ActionNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#4da6e8", strokeWidth: 2 },
  animated: false,
};

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onChange: (nodes: Node[], edges: Edge[]) => void;
}

export function FlowCanvas({ initialNodes, initialEdges, onChange }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge(params, eds);
        onChange(nodes, next);
        return next;
      });
    },
    [setEdges, nodes, onChange],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = { x: e.clientX - 250, y: e.clientY - 100 };
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: type === "trigger" ? "Start" : "" },
      };
      setNodes((nds) => {
        const next = [...nds, newNode];
        onChange(next, edges);
        return next;
      });
    },
    [setNodes, edges, onChange],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          onChange(nodes, edges);
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          onChange(nodes, edges);
        }}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls
          showInteractive={false}
          className="!shadow-md !rounded-lg !border !border-border/50 !bg-white"
        />
      </ReactFlow>
    </div>
  );
}
