"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function ContactInfoPanel({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    api.get<Contact>(`/api/contacts/${contactId}`).then(setContact);
  }, [contactId]);

  if (!contact) return <div className="w-72 border-l p-4 text-sm text-muted-foreground">Loading…</div>;

  const initials = contact.name
    ? contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex w-72 flex-col border-l">
      <div className="flex flex-col items-center gap-2 p-6">
        <Avatar size="lg">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold">{contact.name || "Unknown"}</h3>
        {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
      </div>
      <Separator />
      <div className="space-y-3 p-4 text-sm">
        {contact.phone && (
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p>{contact.phone}</p>
          </div>
        )}
        {contact.locale && (
          <div>
            <p className="text-xs text-muted-foreground">Locale</p>
            <p>{contact.locale}</p>
          </div>
        )}
        {contact.tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
