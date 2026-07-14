"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Edit, Info, Mail, Phone, Globe, AtSign } from "lucide-react";

export function ContactInfoPanel({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [propsOpen, setPropsOpen] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(false);

  useEffect(() => {
    api.get<Contact>(`/api/contacts/${contactId}`).then(setContact);
  }, [contactId]);

  if (!contact) return <div className="w-[320px] border-l p-4 text-sm text-muted-foreground">Loading…</div>;

  const initials = contact.name
    ? contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex w-[320px] flex-col border-l overflow-y-auto">
      {/* Contact info header — matches design */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Contact info</span>
        </div>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Profile card */}
      <div className="flex flex-col items-center gap-2 px-6 py-5">
        <div className="relative">
          <Avatar size="lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <button className="absolute -right-1 -top-1 rounded-full bg-card p-1 shadow-sm border">
            <Edit className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <h3 className="text-base font-semibold">{contact.name || "Unknown"}</h3>
        {contact.locale && (
          <p className="text-xs text-muted-foreground">{contact.locale}</p>
        )}
        <p className="text-xs text-primary">4 Conversations (2 open)</p>
        {/* Social icons */}
        <div className="flex items-center gap-3 mt-1">
          <AtSign className="h-4 w-4 text-sky-500" />
          <Globe className="h-4 w-4 text-blue-600" />
        </div>
      </div>

      <Separator />

      {/* Contact details */}
      <div className="space-y-4 px-5 py-4">
        {contact.email && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Email address</p>
            <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
            <a href={`tel:${contact.phone}`} className="text-sm text-primary hover:underline">{contact.phone}</a>
          </div>
        )}
      </div>

      <Separator />

      {/* Contact Properties — collapsible */}
      <div>
        <button
          onClick={() => setPropsOpen(!propsOpen)}
          className="flex w-full items-center justify-between px-5 py-3"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Contact Properties</span>
          </div>
          {propsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {propsOpen && (
          <div className="space-y-3 px-5 pb-4">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Locale</p>
              <p className="text-sm">{contact.locale || "—"}</p>
            </div>
            {Object.entries(contact.metadata_ || {}).map(([key, value]) => (
              <div key={key}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{key}</p>
                <p className="text-sm">{String(value)}</p>
              </div>
            ))}
            {contact.tags.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Events timeline — collapsible */}
      <div>
        <button
          onClick={() => setEventsOpen(!eventsOpen)}
          className="flex w-full items-center justify-between px-5 py-3"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Events timeline</span>
          </div>
          {eventsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {eventsOpen && (
          <div className="px-5 pb-4">
            <p className="text-xs text-muted-foreground">No events recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
