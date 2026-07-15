"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Users, MessageSquareText, BrainCircuit, Palette } from "lucide-react";

const settingsNav = [
  { href: "/settings", icon: User, label: "General" },
  { href: "/settings/agents", icon: Users, label: "Agents" },
  { href: "/settings/canned", icon: MessageSquareText, label: "Canned Responses" },
  { href: "/settings/ai", icon: BrainCircuit, label: "AI Configuration" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      <nav className="w-56 shrink-0 border-r bg-muted/30 p-4 space-y-1">
        <h2 className="mb-3 px-2 text-lg font-semibold">Settings</h2>
        {settingsNav.map(({ href, icon: Icon, label }) => {
          const active = href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
