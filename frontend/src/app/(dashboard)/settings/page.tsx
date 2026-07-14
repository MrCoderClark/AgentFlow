"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Organization } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { agent } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Organization>("/api/org").then(setOrg);
  }, []);

  async function saveOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await api.put("/api/org", {
      name: fd.get("name"),
      widget_config: {
        ...org.widget_config,
        greeting: fd.get("greeting"),
        bot_name: fd.get("bot_name"),
        primary_color: fd.get("primary_color"),
      },
    });
    setSaving(false);
  }

  if (!org) return <div className="p-6 text-muted-foreground">Loading…</div>;

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001"}/widget.js" data-org="${org.slug}"></script>`;

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <h2 className="text-xl font-semibold">Settings</h2>
      <Tabs defaultValue="org">
        <TabsList>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>
        <TabsContent value="org">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization name</Label>
                  <Input id="name" name="name" defaultValue={org.name} />
                </div>
                <p className="text-sm text-muted-foreground">Slug: <code>{org.slug}</code></p>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <CardTitle>Widget Config</CardTitle>
              <CardDescription>Customize the chat widget</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot_name">Bot name</Label>
                  <Input id="bot_name" name="bot_name" defaultValue={(org.widget_config.bot_name as string) || "Support Bot"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting message</Label>
                  <Input id="greeting" name="greeting" defaultValue={(org.widget_config.greeting as string) || "Hello! How can I help?"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary color</Label>
                  <Input id="primary_color" name="primary_color" type="color" defaultValue={(org.widget_config.primary_color as string) || "#000000"} className="h-10 w-20" />
                </div>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Add this to your website</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{embedCode}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
