"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { BotFlow } from "@/types";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Search, SlidersHorizontal, Clock, X } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

export default function FlowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<BotFlow | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
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
    await save();
    await api.post(`/api/bot-flows/${id}/activate`);
    router.push("/flows");
  }

  if (!flow) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="flex h-full flex-col">
      {/* Topbar — matches Design-Flow */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/flows")} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 max-w-xs text-sm font-medium" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={save} disabled={saving}>
            <Zap className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Clock className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTestOpen(!testOpen)}>
            Test your bot
          </Button>
          <Button size="sm" onClick={activate} className="gap-1.5">
            <span>▶</span> Publish
          </Button>
        </div>
      </div>

      {/* Canvas + optional test panel */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* Test bot panel — right side chat preview */}
        {testOpen && (
          <div className="w-[380px] border-l flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs text-primary-foreground font-bold">B</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Bot</p>
                  <p className="text-xs text-emerald-500">Online</p>
                </div>
              </div>
              <button onClick={() => setTestOpen(false)} className="rounded p-1 hover:bg-accent">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="text-xs text-muted-foreground">Bot</div>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm max-w-[80%]">
                Thanks. What&apos;s your name?
              </div>
              <div className="text-xs text-muted-foreground text-right">You</div>
              <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm max-w-[80%] ml-auto">
                Test User
              </div>
              <div className="text-xs text-muted-foreground">Bot</div>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm max-w-[80%]">
                Please, describe your problem below
              </div>
            </div>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <input
                  placeholder="Send a message..."
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="icon" className="h-9 w-9">▶</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
