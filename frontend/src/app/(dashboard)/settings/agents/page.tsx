"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    api.get<Agent[]>("/api/agents").then(setAgents).catch(() => {});
  }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    const fd = new FormData(e.currentTarget);
    await api.post("/api/auth/invite", {
      email: fd.get("email"),
      name: fd.get("name"),
      role: fd.get("role") || "agent",
    });
    setOpen(false);
    setInviting(false);
    api.get<Agent[]>("/api/agents").then(setAgents).catch(() => {});
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agents</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Invite Agent</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-name">Name</Label>
                <Input id="inv-name" name="name" required />
              </div>
              <Button type="submit" disabled={inviting}>{inviting ? "Inviting…" : "Send Invite"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {agents.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{a.role}</Badge>
                <Badge variant={a.status === "online" ? "default" : "secondary"}>{a.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {agents.length === 0 && <p className="text-sm text-muted-foreground">No agents found</p>}
      </div>
    </div>
  );
}
