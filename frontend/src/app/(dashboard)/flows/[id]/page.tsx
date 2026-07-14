"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { BotFlow } from "@/types";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Node, Edge } from "@xyflow/react";

export default function FlowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<BotFlow | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    api.get<BotFlow>(`/api/bot-flows/${id}`).then((f) => {
      setFlow(f);
      setName(f.name);
      nodesRef.current = (f.flow_data.nodes as Node[]) || [];
      edgesRef.current = (f.flow_data.edges as Edge[]) || [];
    });
  }, [id]);

  async function save() {
    setSaving(true);
    await api.put(`/api/bot-flows/${id}`, {
      name,
      flow_data: { nodes: nodesRef.current, edges: edgesRef.current },
    });
    setSaving(false);
  }

  async function activate() {
    await api.post(`/api/bot-flows/${id}/activate`);
    router.push("/flows");
  }

  if (!flow) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b px-4 py-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button variant="secondary" onClick={activate}>Activate</Button>
        <Button variant="ghost" onClick={() => router.push("/flows")}>Back</Button>
      </div>
      <div className="flex-1">
        <FlowCanvas
          initialNodes={(flow.flow_data.nodes as Node[]) || []}
          initialEdges={(flow.flow_data.edges as Edge[]) || []}
          onChange={(nodes, edges) => {
            nodesRef.current = nodes;
            edgesRef.current = edges;
          }}
        />
      </div>
    </div>
  );
}
