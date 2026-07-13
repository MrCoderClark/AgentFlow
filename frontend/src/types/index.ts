export interface Organization {
  id: string;
  name: string;
  slug: string;
  widget_config: Record<string, unknown>;
  created_at: string;
}

export interface Agent {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  avatar_url: string | null;
  status: "online" | "away" | "offline";
  created_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  locale: string | null;
  metadata_: Record<string, unknown>;
  tags: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  contact_id: string;
  assigned_agent_id: string | null;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  channel: string;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "contact" | "agent" | "bot";
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "system";
  created_at: string;
}

export interface PrivateNote {
  id: string;
  conversation_id: string;
  agent_id: string;
  content: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface KnowledgeArticle {
  id: string;
  org_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BotFlow {
  id: string;
  org_id: string;
  name: string;
  flow_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CannedResponse {
  id: string;
  org_id: string;
  shortcode: string;
  content: string;
}

export interface ApiKeyInfo {
  id: string;
  org_id: string;
  provider: "claude" | "openai";
  created_at: string;
}
