# Customer Support Platform — Design Spec

## Overview

A multi-tenant SaaS customer support platform with an AI-powered chatbot, embeddable website widget, agent inbox dashboard, visual bot flow builder, and RAG-based knowledge base. Comparable to Zendesk/Freshdesk.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.12+, FastAPI (async) |
| Frontend | Next.js 16, Tailwind CSS v4, shadcn/ui v4 |
| Chat Widget | Standalone Vite project, Shadow DOM |
| Database | PostgreSQL 16 + pgvector extension |
| Real-time | WebSockets (FastAPI native) |
| Cache/PubSub | Redis |
| AI | Provider-agnostic (Claude / OpenAI) — BYOK per org |
| Email (dev) | Mailhog via Docker |
| ORM | SQLAlchemy (async) + Alembic migrations |
| Flow Builder | React Flow |
| Auth | JWT (access + refresh tokens) |
| Containerization | Docker Compose (dev) |

## Architecture

Monorepo with unified FastAPI backend. Single backend process handles REST API, WebSocket connections, AI orchestration, and bot flow execution. Next.js app serves the agent dashboard. Standalone widget bundle embeds on any website.

```
customer-support/
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── main.py              # App, CORS, lifespan
│   │   ├── config.py            # Settings via env vars
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── auth.py          # Login, register, JWT
│   │   │   ├── conversations.py # CRUD + list/filter/assign
│   │   │   ├── contacts.py      # Contact management
│   │   │   ├── messages.py      # Message history
│   │   │   ├── knowledge.py     # Article CRUD + upload
│   │   │   ├── bot_flows.py     # Flow CRUD
│   │   │   ├── canned.py        # Canned responses
│   │   │   └── org.py           # Org settings, widget config
│   │   ├── ws/
│   │   │   ├── manager.py       # WebSocket connection manager
│   │   │   ├── widget.py        # Widget WS endpoint
│   │   │   └── agent.py         # Agent dashboard WS endpoint
│   │   ├── ai/
│   │   │   ├── provider.py      # Abstract LLM interface
│   │   │   ├── rag.py           # Vector search knowledge articles
│   │   │   ├── bot_engine.py    # Bot flow executor
│   │   │   └── intent.py        # Intent classification
│   │   └── services/
│   │       ├── conversation.py  # Business logic
│   │       └── notification.py  # Email notifications
│   ├── alembic/                 # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js 16 agent dashboard
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # UI components
│   │   ├── lib/             # Utilities, API client, WS hook
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── widget/                  # Embeddable chat widget
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml   # Postgres, Redis, Mailhog
└── docs/
```

## Multi-Tenancy

Row-level isolation. Every table has an `org_id` foreign key. All queries filter by org. No schema-per-tenant.

### Registration Flow

- **Org creation** is open — anyone registers, creates their organization, becomes admin
- **Agent accounts** are invite-only within an org — admin invites via email
- **Email verification** required before account activation
- **Rate limiting** on registration endpoint

Flow: Founder registers → creates org → invites agents → agents join via invite link.

## Data Model

### Organization
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | Display name |
| slug | VARCHAR | Unique, used in widget embed + API URLs |
| widget_config | JSONB | Colors, greeting, bot name, position |
| created_at | TIMESTAMP | |

### Agent
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| email | VARCHAR | Unique per org |
| password_hash | VARCHAR | bcrypt |
| name | VARCHAR | Display name |
| role | ENUM | admin, agent |
| avatar_url | VARCHAR | Optional |
| status | ENUM | online, away, offline |
| is_verified | BOOLEAN | Email verified |
| created_at | TIMESTAMP | |

### Contact
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| name | VARCHAR | Optional (anonymous users) |
| email | VARCHAR | Optional |
| phone | VARCHAR | Optional |
| locale | VARCHAR | e.g. en-GB |
| metadata | JSONB | Custom properties (membership, lifetime value, etc.) |
| tags | VARCHAR[] | Array of tag strings |
| created_at | TIMESTAMP | |

### Conversation
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| contact_id | UUID | FK → Contact |
| assigned_agent_id | UUID | FK → Agent, nullable |
| subject | VARCHAR | Auto-generated or from bot flow |
| status | ENUM | open, pending, resolved, closed |
| channel | VARCHAR | widget, email, etc. |
| priority | ENUM | low, normal, high, urgent |
| flow_state | JSONB | Current bot flow node + state |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Message
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| conversation_id | UUID | FK → Conversation |
| sender_type | ENUM | contact, agent, bot |
| sender_id | UUID | Contact or Agent ID |
| content | TEXT | Message body |
| message_type | ENUM | text, image, system |
| created_at | TIMESTAMP | |

### PrivateNote
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| conversation_id | UUID | FK → Conversation |
| agent_id | UUID | FK → Agent |
| content | TEXT | |
| created_at | TIMESTAMP | |

### KnowledgeArticle
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| title | VARCHAR | |
| content | TEXT | |
| embedding | VECTOR | pgvector, dimension depends on provider (1536 for OpenAI, 1024 for Claude) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### BotFlow
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| name | VARCHAR | |
| flow_data | JSONB | React Flow nodes + edges |
| is_active | BOOLEAN | Only one active per org |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### CannedResponse
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| shortcode | VARCHAR | Triggered with "/" in reply box |
| content | TEXT | |

### OrgApiKey
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| org_id | UUID | FK → Organization |
| provider | ENUM | claude, openai |
| encrypted_key | VARCHAR | AES-encrypted API key |
| created_at | TIMESTAMP | |

## Authentication

- **Agents:** Email/password → JWT (access token 15min + refresh token 7d)
- **Widget users:** Anonymous, identified by session cookie + optional name/email. No auth required — scoped to org via slug in URL.
- **Org admin actions** (invite agents, manage settings, API keys) require `role=admin` check.

## WebSocket Architecture

Two WebSocket endpoints:

### Widget: `/ws/widget/{org_slug}`
- Customer connects when widget opens
- Creates or resumes conversation (via localStorage conversation_id)
- Sends messages, receives bot/agent responses
- Typing indicators both directions

### Agent Dashboard: `/ws/agent/{org_id}`
- Agent connects on dashboard mount (requires JWT in connection params)
- Receives: new conversations, new messages, typing indicators, assignment changes
- Sends: messages, assignment actions, status changes

### Connection Manager
- Tracks active connections per org, per type (widget vs agent)
- Routes messages: widget message → bot engine → if escalated, broadcast to agents
- Agent reply → route to specific widget connection
- Redis pub/sub for horizontal scaling (multiple backend instances)

## AI Bot Engine

### BYOK (Bring Your Own Key)
Each org provides their own LLM API key via settings. Keys stored AES-encrypted in `OrgApiKey` table. No platform-managed AI — orgs control their own cost and provider choice.

### Provider-Agnostic Interface
```python
class LLMProvider(ABC):
    async def generate(self, messages: list, system_prompt: str) -> LLMResponse
    async def embed(self, text: str) -> list[float]

class ClaudeProvider(LLMProvider): ...
class OpenAIProvider(LLMProvider): ...
```
Provider selected per org based on their `OrgApiKey.provider` value.

### AI Pipeline (per incoming widget message)
1. Check if conversation has an active bot flow → execute next flow step
2. If no flow: RAG search knowledge base (pgvector cosine similarity, top-3 articles)
3. LLM generates response with system prompt + knowledge context + conversation history
4. Intent classification (returned alongside response): `can_handle` / `needs_human` / `unclear`
5. Route: `can_handle` → send AI response; `needs_human` → escalate to agent queue; `unclear` → ask clarifying question

### Knowledge Base RAG
- Admin uploads articles via dashboard (title + content)
- On save: content chunked → embedded via org's LLM provider → stored with pgvector
- On customer message: embed message → cosine similarity search → top-3 chunks injected as LLM context

### Bot Flow Execution
- Flow stored as JSONB (React Flow nodes + edges)
- Engine walks the graph: current node → evaluate conditions → next node → execute action
- Node types: Trigger, Condition (success/failure), Action (create ticket, send message), Bot Response
- State tracked in `conversation.flow_state` (current node ID + collected data)

## Frontend — Agent Dashboard

### Layout (matching Design-Backend reference)
3-panel layout:
- **Left sidebar:** Navigation icons (inbox, contacts, knowledge, flows, settings)
- **Conversation list:** Sorted by newest, "Assigned to me" with count, search/filter, tags/channel indicators
- **Center chat panel:** Message thread, Reply/Private Note tabs, rich text input with canned response trigger (`/`), attachments toolbar, send button
- **Right contact panel:** Contact info (name, location, email, phone, social), contact properties (locale, membership, lifetime value), tags, conversation history, collapsible sections

### Routes
| Route | Purpose |
|---|---|
| `/login` | Agent email/password login |
| `/register` | Organization + first agent signup |
| `/inbox` | Main 3-panel inbox |
| `/inbox/[conversationId]` | Selected conversation |
| `/flows` | Bot flow list |
| `/flows/[flowId]` | Visual flow editor |
| `/knowledge` | Knowledge base articles |
| `/contacts` | Contact list + detail |
| `/settings` | Org settings, widget config, embed code |
| `/settings/agents` | Agent management (invite, roles) |
| `/settings/canned` | Canned response management |
| `/settings/ai` | API key configuration (BYOK) |

### Key Components
- **ConversationList** — filterable, sortable, avatar, preview, time, tags
- **ChatPanel** — message thread, Reply/Private Note tabs, canned responses
- **ContactInfoPanel** — contact details, properties, tags, history
- **FlowCanvas** — React Flow drag-and-drop with node types: Trigger, Condition, Action, Bot Response
- **TopBar** — search, notifications, agent status toggle, profile menu

### Real-time
Dashboard WebSocket connects on mount. All updates pushed — no polling. New conversations, messages, typing indicators, assignment changes.

## Embeddable Chat Widget

### Embed Code
```html
<script src="https://your-domain.com/widget.js" data-org="acme-corp"></script>
```

### Behavior
1. Script injects floating chat bubble (bottom-right by default)
2. Click opens chat panel
3. Connects via WebSocket to `/ws/widget/{org_slug}`
4. Bot initiates: greeting → collects name → collects problem
5. AI responds from knowledge base or follows active bot flow
6. Escalation: "I'll pass it to our Customer Service Team"
7. Session persisted via localStorage (survives page refresh)

### Technical
- Standalone Vite project → single JS bundle + CSS
- Shadow DOM for style isolation from host page
- Widget config (colors, greeting, bot name, position) loaded from org settings API
- Customizable: primary color, bot name/avatar, welcome message, position

## Infrastructure (Development)

### Docker Compose
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: customer_support
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

volumes:
  pgdata:
```

### Dev Workflow
```bash
docker compose up -d          # Start Postgres, Redis, Mailhog
cd backend && uvicorn app.main:app --reload  # API on :8000
cd frontend && npm run dev    # Dashboard on :3000
cd widget && npm run dev      # Widget dev on :5173
```

### Environment Variables (backend)
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/customer_support
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-secret>
ENCRYPTION_KEY=<aes-key-for-api-keys>
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```
