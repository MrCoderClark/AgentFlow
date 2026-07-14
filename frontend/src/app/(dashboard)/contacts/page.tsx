"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    api.get<Contact[]>("/api/contacts").then(setContacts);
  }, []);

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <h2 className="text-xl font-semibold">Contacts</h2>
      <div className="space-y-2">
        {contacts.map((c) => {
          const initials = c.name
            ? c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "?";
          return (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{c.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{c.email || "No email"}</p>
                </div>
                <div className="flex gap-1">
                  {c.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts yet</p>}
      </div>
    </div>
  );
}
