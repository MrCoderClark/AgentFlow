"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CannedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export default function CannedPage() {
  const [items, setItems] = useState<CannedResponse[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    api.get<CannedResponse[]>("/api/canned").then(setItems);
  }

  useEffect(reload, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post("/api/canned", { shortcode: fd.get("shortcode"), content: fd.get("content") });
    setOpen(false);
    reload();
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/canned/${id}`);
    reload();
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Canned Responses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Add Response</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Canned Response</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shortcode">Shortcode</Label>
                <Input id="shortcode" name="shortcode" required placeholder="/greeting" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea name="content" id="content" required rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Hello! How can I help you today?" />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {items.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium font-mono text-sm">/{c.shortcode}</p>
                <p className="text-sm text-muted-foreground truncate max-w-md">{c.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No canned responses</p>}
      </div>
    </div>
  );
}
