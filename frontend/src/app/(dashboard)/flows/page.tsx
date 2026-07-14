"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BotFlow } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export default function FlowsPage() {
  const [flows, setFlows] = useState<BotFlow[]>([]);

  function reload() {
    api.get<BotFlow[]>("/api/bot-flows").then(setFlows);
  }

  useEffect(reload, []);

  async function createFlow() {
    const flow = await api.post<BotFlow>("/api/bot-flows", {
      name: `Flow ${flows.length + 1}`,
      flow_data: { nodes: [], edges: [] },
    });
    window.location.href = `/flows/${flow.id}`;
  }

  async function deleteFlow(id: string) {
    await api.delete(`/api/bot-flows/${id}`);
    reload();
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bot Flows</h2>
        <Button onClick={createFlow}>
          <Plus className="mr-2 h-4 w-4" /> New Flow
        </Button>
      </div>
      <div className="space-y-2">
        {flows.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-center justify-between py-3">
              <Link href={`/flows/${f.id}`} className="flex-1">
                <p className="font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">Updated {new Date(f.updated_at).toLocaleDateString()}</p>
              </Link>
              <div className="flex items-center gap-2">
                {f.is_active && <Badge>Active</Badge>}
                <Button variant="ghost" size="icon" onClick={() => deleteFlow(f.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {flows.length === 0 && <p className="text-sm text-muted-foreground">No flows yet — create one to get started</p>}
      </div>
    </div>
  );
}
