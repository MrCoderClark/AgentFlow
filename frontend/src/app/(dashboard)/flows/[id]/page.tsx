"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { BotFlow } from "@/types";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { Button } from "@/components/ui/button";
import { Zap, Search, SlidersHorizontal, Clock, X, Send, MoreVertical, MessageSquare } from "lucide-react";
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
      <div className="flex items-center justify-between border-b bg-card px-5 py-2.5">
        <h1 className="text-lg font-semibold text-foreground">{name || "Untitled flow"}</h1>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={save} disabled={saving}>
            <Zap className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Clock className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-9 border-primary text-primary hover:bg-primary/5 font-medium"
            onClick={() => setTestOpen(!testOpen)}
          >
            Test your bot
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 bg-primary hover:bg-primary/90 font-medium"
            onClick={activate}
          >
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Canvas + optional test panel */}
      <div className="relative flex flex-1 overflow-hidden">
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

        {/* Test bot panel — chat preview matching Design-Flow */}
        {testOpen && (
          <div className="w-[380px] border-l bg-card flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-base font-bold">Bot</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded p-1.5 hover:bg-accent">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => setTestOpen(false)} className="rounded p-1.5 hover:bg-accent">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Bot message */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <MessageSquare className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Bot</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm max-w-[85%]">
                  Thanks. What&apos;s your name?
                </div>
              </div>

              {/* User message */}
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-muted-foreground mb-1">You</span>
                <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[85%]">
                  Annie Hall
                </div>
              </div>

              {/* Bot message */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <MessageSquare className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Bot</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm max-w-[85%]">
                  Please, describe your problem below ⬇
                </div>
              </div>

              {/* User message */}
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-muted-foreground mb-1">You</span>
                <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[85%]">
                  What can I do if the Order Tracking system says that my package is delivered, but I don&apos;t have my package?
                </div>
              </div>

              {/* Bot message */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <MessageSquare className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Bot</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm max-w-[85%]">
                  Thanks for your message. I&apos;ll pass it to our Customer Service Team. <span className="text-xs text-muted-foreground">soon</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Send a message..."
                  className="flex-1 rounded-full border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-primary">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating chat bubble — bottom right */}
        {!testOpen && (
          <button
            onClick={() => setTestOpen(true)}
            className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
