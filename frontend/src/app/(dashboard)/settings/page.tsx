"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, resolveAvatarUrl } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Agent, Organization } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export default function SettingsPage() {
  const { agent, uploadAvatar, updateAgent } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("display_name") as string;
    const updated = await api.put<Agent>("/api/auth/me", { name });
    updateAgent({ name: updated.name });
    setProfileSaving(false);
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMsg("");
    const fd = new FormData(e.currentTarget);
    const newPw = fd.get("new_password") as string;
    const confirm = fd.get("confirm_password") as string;
    if (newPw !== confirm) {
      setPasswordMsg("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPasswordMsg("Password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    await api.put("/api/auth/me/password", { password: newPw });
    setPasswordSaving(false);
    setPasswordMsg("Password updated");
    e.currentTarget.reset();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  }

  const initials = agent?.name
    ? agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  if (!org) return <div className="p-6 text-muted-foreground">Loading…</div>;

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001"}/widget.js" data-org="${org.slug}"></script>`;

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <h2 className="text-xl font-semibold">Settings</h2>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Click to upload a new profile photo</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-5">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button onClick={() => fileRef.current?.click()} className="group relative">
                <Avatar size="lg" className="h-20 w-20 ring-2 ring-primary/20">
                  {agent?.avatar_url && <AvatarImage src={resolveAvatarUrl(agent.avatar_url)!} alt={agent.name} />}
                  <AvatarFallback className="bg-amber-100 text-amber-800 font-semibold text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <div>
                <p className="text-sm font-medium">{agent?.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{agent?.email || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Name</CardTitle>
              <CardDescription>This is how your name appears to contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Name</Label>
                  <Input id="display_name" name="display_name" defaultValue={agent?.name || ""} />
                </div>
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? "Saving…" : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input id="new_password" name="new_password" type="password" required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm password</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
                </div>
                {passwordMsg && (
                  <p className={`text-sm ${passwordMsg.includes("match") || passwordMsg.includes("least") ? "text-destructive" : "text-emerald-600"}`}>
                    {passwordMsg}
                  </p>
                )}
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization tab */}
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

        {/* Widget tab */}
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
