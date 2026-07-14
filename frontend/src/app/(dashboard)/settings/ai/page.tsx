"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiKeyInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Key } from "lucide-react";

export default function AISettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [provider, setProvider] = useState<"claude" | "openai">("claude");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    api.get<ApiKeyInfo[]>("/api/org/api-keys").then(setKeys);
  }

  useEffect(reload, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api.post("/api/org/api-keys", { provider, api_key: apiKey });
    setApiKey("");
    setSaving(false);
    reload();
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/org/api-keys/${id}`);
    reload();
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <h2 className="text-xl font-semibold">AI Configuration</h2>
      <Card>
        <CardHeader>
          <CardTitle>API Keys (BYOK)</CardTitle>
          <CardDescription>Bring your own LLM provider keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "claude" | "openai")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" required placeholder="sk-..." />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Key"}</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {keys.map((k) => (
          <Card key={k.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{k.provider}</span>
                <span className="text-xs text-muted-foreground">Added {new Date(k.created_at).toLocaleDateString()}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(k.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {keys.length === 0 && <p className="text-sm text-muted-foreground">No API keys configured</p>}
      </div>
    </div>
  );
}
