"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { KnowledgeArticle } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    api.get<KnowledgeArticle[]>("/api/knowledge").then(setArticles);
  }

  useEffect(reload, []);

  function selectArticle(a: KnowledgeArticle) {
    setSelected(a);
    setTitle(a.title);
    setContent(a.content);
  }

  function newArticle() {
    setSelected(null);
    setTitle("");
    setContent("");
  }

  async function handleSave() {
    setSaving(true);
    if (selected) {
      await api.put(`/api/knowledge/${selected.id}`, { title, content });
    } else {
      await api.post("/api/knowledge", { title, content });
    }
    setSaving(false);
    reload();
    newArticle();
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/knowledge/${id}`);
    reload();
    if (selected?.id === id) newArticle();
  }

  return (
    <div className="flex h-full">
      <div className="w-72 border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Knowledge Base</h2>
          <Button variant="ghost" size="icon" onClick={newArticle}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1 p-2">
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => selectArticle(a)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selected?.id === a.id ? "bg-accent" : ""}`}
            >
              <span className="truncate">{a.title}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="article-content">Content</Label>
          <textarea
            id="article-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={16}
            placeholder="Write your article content here…"
          />
        </div>
        <Button onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving…" : selected ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}
