"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, resolveAvatarUrl } from "@/lib/auth-context";
import {
  Inbox,
  Users,
  UserPlus,
  MessageSquare,
  BookOpen,
  Workflow,
  Crosshair,
  Phone,
  BarChart3,
  Bell,
  HelpCircle,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const topNav = [
  { href: "/inbox", icon: MessageSquare, label: "Inbox" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/contacts", icon: UserPlus, label: "Leads" },
  { href: "/inbox", icon: Inbox, label: "Conversations" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { href: "/flows", icon: Workflow, label: "Bot Flows" },
  { href: "/settings", icon: Crosshair, label: "Campaigns" },
  { href: "/settings", icon: Phone, label: "Phone" },
  { href: "/settings", icon: BarChart3, label: "Reports" },
];

const bottomNav = [
  { href: "/settings", icon: Bell, label: "Notifications" },
  { href: "/settings", icon: HelpCircle, label: "Help" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { agent } = useAuth();
  const initials = agent?.name
    ? agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <aside className="flex h-full w-[52px] flex-col items-center bg-sidebar py-3">
      {/* Logo */}
      <Link href="/inbox" className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
        <MessageSquare className="h-5 w-5 text-sidebar-primary-foreground" />
      </Link>

      {/* Top nav */}
      <TooltipProvider delay={0}>
        <nav className="flex flex-1 flex-col items-center gap-0.5">
          {topNav.map(({ href, icon: Icon, label }, i) => {
            const active = pathname.startsWith(href) && i === 0;
            return (
              <Tooltip key={`${href}-${i}`}>
                <TooltipTrigger
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
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

        {/* Bottom nav */}
        <div className="flex flex-col items-center gap-0.5 mt-auto">
          {bottomNav.map(({ href, icon: Icon, label }, i) => (
            <Tooltip key={`bottom-${i}`}>
              <TooltipTrigger
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                render={<Link href={href} />}
              >
                <Icon className="h-[18px] w-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
          {/* Grid/apps icon */}
          <button className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50">
            <LayoutGrid className="h-[18px] w-[18px]" />
          </button>
          {/* User avatar at very bottom */}
          {agent?.avatar_url ? (
            <img src={resolveAvatarUrl(agent.avatar_url)!} alt={agent.name} className="mt-1 h-8 w-8 rounded-full object-cover ring-2 ring-sidebar-accent" />
          ) : (
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-900 text-xs font-semibold ring-2 ring-sidebar-accent">
              {initials}
            </div>
          )}
        </div>
      </TooltipProvider>
    </aside>
  );
}
