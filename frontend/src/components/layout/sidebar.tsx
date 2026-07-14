"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Users, BookOpen, Workflow, Settings, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge" },
  { href: "/flows", icon: Workflow, label: "Bot Flows" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r bg-card py-4">
      <Link href="/inbox" className="mb-8 flex items-center justify-center">
        <MessageSquare className="h-7 w-7 text-primary" />
      </Link>
      <TooltipProvider delay={0}>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Tooltip key={href}>
              <TooltipTrigger
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                render={<Link href={href} />}
              >
                <Icon className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
