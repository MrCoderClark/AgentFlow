"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Users,
  BookOpen,
  Workflow,
  Settings,
  MessageSquare,
  BarChart3,
  Phone,
  Crosshair,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { href: "/flows", icon: Workflow, label: "Bot Flows" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-14 flex-col items-center bg-[hsl(var(--sidebar))] border-r py-3">
      {/* Logo */}
      <Link href="/inbox" className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <MessageSquare className="h-5 w-5 text-primary-foreground" />
      </Link>

      {/* Navigation */}
      <TooltipProvider delay={0}>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  render={<Link href={href} />}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent">
          <LayoutGrid className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  );
}
