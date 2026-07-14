"use client";

import { useRef } from "react";
import { Bell, LogOut, Search, MessageCircle, BarChart3, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { agent, logout, uploadAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = agent?.name
    ? agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <h1 className="text-base font-semibold">Team Inbox</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversation, contacts, etc.."
            className="h-9 w-64 pl-8 text-sm"
          />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <MessageCircle className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus:outline-none">
            <Avatar size="lg" className="ring-2 ring-primary/20">
              {agent?.avatar_url && <AvatarImage src={agent.avatar_url} alt={agent.name} />}
              <AvatarFallback className="bg-amber-100 text-amber-800 font-semibold text-sm">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload avatar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
