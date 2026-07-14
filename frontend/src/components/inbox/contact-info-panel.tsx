"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Edit, Info, Globe, AtSign, Users, MapPin } from "lucide-react";

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
    <div className="flex w-[320px] flex-col border-l bg-card overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Contact info</span>
        </div>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center gap-1.5 px-6 py-5">
        <div className="relative">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm border">
            <Edit className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <h3 className="text-base font-semibold text-foreground">{contact.name || "Unknown"}</h3>
        {contact.locale && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {contact.locale}
          </p>
        )}
        <p className="text-xs text-primary font-medium flex items-center gap-1">
          <Info className="h-3 w-3" />
          4 Conversations (2 open)
        </p>
        {/* Social icons — colored circles */}
        <div className="flex items-center gap-2 mt-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-400 text-white">
            <AtSign className="h-3.5 w-3.5" />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
            <Globe className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <Separator />

      {/* Email & Phone — teal links */}
      <div className="space-y-3.5 px-5 py-4">
        <div className="flex items-start gap-3">
          <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email address</p>
            <a href={`mailto:${contact.email || ""}`} className="text-sm text-primary hover:underline">
              {contact.email || "—"}
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-4 w-4 items-center justify-center text-primary mt-0.5 shrink-0">◆</span>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
            <a href={`tel:${contact.phone || ""}`} className="text-sm text-primary hover:underline">
              {contact.phone || "—"}
            </a>
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Properties — collapsible */}
      <div>
        <button
          onClick={() => setPropsOpen(!propsOpen)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Contact Properties</span>
          </div>
          {propsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {propsOpen && (
          <div className="space-y-3.5 px-5 pb-4">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Locale</p>
              <p className="text-sm font-medium">{contact.locale || "en-GB"}</p>
            </div>
            {/* Properties from metadata */}
            {Object.entries(contact.metadata_ || {}).map(([key, value]) => (
              <div key={key}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                {typeof value === "boolean" || value === "Yes" || value === "No" ? (
                  <p className="text-sm font-medium">{String(value)}</p>
                ) : (
                  <p className="text-sm font-medium">{String(value)}</p>
                )}
              </div>
            ))}
            {/* Default properties matching design */}
            {Object.keys(contact.metadata_ || {}).length === 0 && (
              <>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Premium Membership</p>
                  <p className="text-sm font-medium">Yes</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Premium membership</p>
                  <select className="mt-0.5 w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Customer lifetime value</p>
                  <p className="text-sm font-medium">$75,808 USD</p>
                </div>
              </>
            )}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1">
                {contact.tags.length > 0 ? (
                  contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs font-normal">Brand Advocate</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Events timeline — collapsible */}
      <div>
        <button
          onClick={() => setEventsOpen(!eventsOpen)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors"
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
