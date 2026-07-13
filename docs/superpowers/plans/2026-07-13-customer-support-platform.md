# Customer Support Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant SaaS customer support platform with AI chatbot, embeddable widget, agent inbox dashboard, and visual bot flow builder.

**Architecture:** Monorepo with unified FastAPI backend (REST + WebSocket + AI), Next.js 16 frontend (agent dashboard), and standalone Vite widget bundle. PostgreSQL + pgvector for data and RAG. Redis for WebSocket pub/sub. BYOK API keys per org.

**Tech Stack:** Python 3.12+ / FastAPI / SQLAlchemy (async) / Alembic / PostgreSQL 16 + pgvector / Redis / Next.js 16 / Tailwind CSS v4 / shadcn/ui v4 / React Flow / Vite / Docker Compose

## Global Constraints

- Python 3.12+ required
- Next.js 16 — check `/docs/` for version-specific APIs before writing frontend code; invoke `tailwindcss-v4` skill before writing styles
- All database tables must include `org_id` FK for multi-tenancy; all queries filter by org
- No hardcoded hex values or raw Tailwind color classes (per AGENTS.md)
- UUIDs for all primary keys
- Async everywhere on the backend (asyncpg, async SQLAlchemy)
- JWT auth for agents; anonymous session for widget users
- BYOK: orgs provide their own LLM API keys — never platform-managed
- Run `/imprint` after building each UI component
- Run `/review` after completing each phase
- Commit at each major milestone and when finishing a phase
- Git branches per phase, merge to `main` on phase completion

## File Map

```
customer-support/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app, CORS, lifespan, router includes
│   │   ├── config.py                  # Pydantic Settings from env vars
│   │   ├── database.py                # Async engine, sessionmaker, get_db dependency
│   │   ├── models/
│   │   │   ├── __init__.py            # Re-exports all models
│   │   │   ├── organization.py        # Organization model
│   │   │   ├── agent.py               # Agent model
│   │   │   ├── contact.py             # Contact model
│   │   │   ├── conversation.py        # Conversation model
│   │   │   ├── message.py             # Message model
│   │   │   ├── private_note.py        # PrivateNote model
│   │   │   ├── knowledge_article.py   # KnowledgeArticle model (with vector)
│   │   │   ├── bot_flow.py            # BotFlow model
│   │   │   ├── canned_response.py     # CannedResponse model
│   │   │   └── org_api_key.py         # OrgApiKey model (encrypted)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # Register, Login, Token, InviteAgent schemas
│   │   │   ├── organization.py        # Org create/update/response schemas
│   │   │   ├── agent.py               # Agent response/update schemas
│   │   │   ├── contact.py             # Contact CRUD schemas
│   │   │   ├── conversation.py        # Conversation CRUD schemas
│   │   │   ├── message.py             # Message create/response schemas
│   │   │   ├── private_note.py        # PrivateNote schemas
│   │   │   ├── knowledge.py           # KnowledgeArticle schemas
│   │   │   ├── bot_flow.py            # BotFlow schemas
│   │   │   ├── canned.py              # CannedResponse schemas
│   │   │   └── org_api_key.py         # ApiKey schemas (never exposes raw key)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                # Shared dependencies (get_current_agent, require_admin)
│   │   │   ├── auth.py                # POST /register, /login, /refresh, /invite, /verify
│   │   │   ├── conversations.py       # CRUD + list/filter/assign
│   │   │   ├── contacts.py            # CRUD
│   │   │   ├── messages.py            # List + create per conversation
│   │   │   ├── private_notes.py       # List + create per conversation
│   │   │   ├── knowledge.py           # CRUD + trigger embed on save
│   │   │   ├── bot_flows.py           # CRUD + activate/deactivate
│   │   │   ├── canned.py              # CRUD
│   │   │   └── org.py                 # Org settings, widget config, API keys
│   │   ├── ws/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py             # ConnectionManager: track connections, route messages
│   │   │   ├── widget.py              # /ws/widget/{org_slug} endpoint
│   │   │   └── agent.py               # /ws/agent/{org_id} endpoint
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── provider.py            # ABC + ClaudeProvider + OpenAIProvider
│   │   │   ├── rag.py                 # embed_text(), search_knowledge()
│   │   │   ├── bot_engine.py          # execute_flow_step()
│   │   │   └── pipeline.py            # process_customer_message() — orchestrates flow/RAG/LLM
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── conversation.py        # create_conversation, assign, update_status
│   │       ├── encryption.py          # AES encrypt/decrypt for API keys
│   │       └── email.py               # send_invite_email, send_verification_email
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                  # Auto-generated migration files
│   ├── tests/
│   │   ├── conftest.py                # Fixtures: test DB, client, auth helpers
│   │   ├── test_auth.py
│   │   ├── test_conversations.py
│   │   ├── test_contacts.py
│   │   ├── test_messages.py
│   │   ├── test_knowledge.py
│   │   ├── test_bot_flows.py
│   │   ├── test_canned.py
│   │   ├── test_org.py
│   │   ├── test_websocket.py
│   │   └── test_ai_pipeline.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                          # Next.js 16 agent dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout, providers
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx         # 3-panel shell: sidebar + topbar
│   │   │       ├── inbox/
│   │   │       │   ├── page.tsx       # Conversation list
│   │   │       │   └── [id]/page.tsx  # Selected conversation
│   │   │       ├── contacts/page.tsx
│   │   │       ├── knowledge/page.tsx
│   │   │       ├── flows/
│   │   │       │   ├── page.tsx       # Flow list
│   │   │       │   └── [id]/page.tsx  # Flow editor
│   │   │       └── settings/
│   │   │           ├── page.tsx       # Org settings + widget config
│   │   │           ├── agents/page.tsx
│   │   │           ├── canned/page.tsx
│   │   │           └── ai/page.tsx    # BYOK API key config
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components (auto-generated)
│   │   │   ├── inbox/
│   │   │   │   ├── conversation-list.tsx
│   │   │   │   ├── conversation-item.tsx
│   │   │   │   ├── chat-panel.tsx
│   │   │   │   ├── message-bubble.tsx
│   │   │   │   ├── reply-box.tsx
│   │   │   │   └── contact-info-panel.tsx
│   │   │   ├── flows/
│   │   │   │   ├── flow-canvas.tsx
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── trigger-node.tsx
│   │   │   │   │   ├── condition-node.tsx
│   │   │   │   │   ├── action-node.tsx
│   │   │   │   │   └── bot-response-node.tsx
│   │   │   │   └── flow-toolbar.tsx
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── topbar.tsx
│   │   │   └── auth/
│   │   │       ├── login-form.tsx
│   │   │       └── register-form.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                 # Fetch wrapper with JWT handling
│   │   │   ├── ws.ts                  # WebSocket hook + connection manager
│   │   │   ├── auth-context.tsx       # Auth provider, useAuth hook
│   │   │   └── utils.ts              # Shared helpers
│   │   └── types/
│   │       └── index.ts               # All TypeScript interfaces
│   ├── package.json
│   └── next.config.ts
├── widget/                            # Embeddable chat widget
│   ├── src/
│   │   ├── main.ts                    # Entry: inject Shadow DOM, load config
│   │   ├── widget.ts                  # Chat UI rendering + state
│   │   ├── ws.ts                      # WebSocket connection + reconnect
│   │   └── styles.css                 # Widget styles (injected into shadow root)
│   ├── index.html                     # Dev test page
│   ├── package.json
│   └── vite.config.ts
└── docker/
    └── docker-compose.yml
```

---

## Phase 1: Backend Foundation

**Branch:** `phase-1/backend-foundation`

**Deliverable:** Docker services running, FastAPI app serving health check, all DB tables created via Alembic migration.

---

### Task 1: Docker Compose + Python Project Scaffold

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`

**Interfaces:**
- Consumes: nothing (foundation task)
- Produces:
  - `app.config.Settings` — Pydantic settings class with `DATABASE_URL: str`, `REDIS_URL: str`, `JWT_SECRET: str`, `ENCRYPTION_KEY: str`, `CORS_ORIGINS: list[str]`, `SMTP_HOST: str`, `SMTP_PORT: int`
  - `app.config.settings` — singleton instance
  - `app.database.async_engine` — SQLAlchemy AsyncEngine
  - `app.database.AsyncSessionLocal` — async_sessionmaker
  - `app.database.get_db() -> AsyncGenerator[AsyncSession, None]` — FastAPI dependency
  - `app.database.Base` — declarative base for all models
  - `GET /health` → `{"status": "ok"}`

- [ ] **Step 1: Create Docker Compose**

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: customer_support
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  pgdata:
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi[standard]>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.30.0
alembic>=1.14.0
pgvector>=0.3.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
cryptography>=43.0.0
httpx>=0.27.0
redis>=5.0.0
aiosmtplib>=3.0.0
python-multipart>=0.0.9
anthropic>=0.40.0
openai>=1.50.0
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

- [ ] **Step 3: Create .env.example**

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/customer_support
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-to-a-random-secret
ENCRYPTION_KEY=change-me-to-a-32-byte-hex-key-00112233445566778899aabbccddeeff
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
SMTP_HOST=localhost
SMTP_PORT=1025
```

- [ ] **Step 4: Create config.py**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/customer_support"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET: str = "change-me"
    JWT_ACCESS_EXPIRY_MINUTES: int = 15
    JWT_REFRESH_EXPIRY_DAYS: int = 7
    ENCRYPTION_KEY: str = "00" * 16
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 5: Create database.py**

```python
# backend/app/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

async_engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 6: Create main.py with health check**

```python
# backend/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Customer Support API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Create empty __init__.py**

```python
# backend/app/__init__.py
```

- [ ] **Step 8: Verify everything starts**

```bash
cd docker && docker compose up -d
cd backend && cp .env.example .env
cd backend && pip install -r requirements.txt
cd backend && uvicorn app.main:app --reload --port 8000
# In another terminal:
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 9: Commit**

```bash
git checkout -b phase-1/backend-foundation
git add docker/ backend/
git commit -m "feat: Docker Compose + FastAPI scaffold with health check"
```

---

### Task 2: SQLAlchemy Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/organization.py`
- Create: `backend/app/models/agent.py`
- Create: `backend/app/models/contact.py`
- Create: `backend/app/models/conversation.py`
- Create: `backend/app/models/message.py`
- Create: `backend/app/models/private_note.py`
- Create: `backend/app/models/knowledge_article.py`
- Create: `backend/app/models/bot_flow.py`
- Create: `backend/app/models/canned_response.py`
- Create: `backend/app/models/org_api_key.py`

**Interfaces:**
- Consumes: `app.database.Base` from Task 1
- Produces: All SQLAlchemy model classes importable from `app.models`
  - `Organization(id: UUID, name: str, slug: str, widget_config: dict, created_at: datetime)`
  - `Agent(id: UUID, org_id: UUID, email: str, password_hash: str, name: str, role: AgentRole, avatar_url: str|None, status: AgentStatus, is_verified: bool, created_at: datetime)`
  - `Contact(id: UUID, org_id: UUID, name: str|None, email: str|None, phone: str|None, locale: str|None, metadata_: dict, tags: list[str], created_at: datetime)`
  - `Conversation(id: UUID, org_id: UUID, contact_id: UUID, assigned_agent_id: UUID|None, subject: str, status: ConversationStatus, channel: str, priority: Priority, flow_state: dict|None, created_at: datetime, updated_at: datetime)`
  - `Message(id: UUID, conversation_id: UUID, sender_type: SenderType, sender_id: UUID, content: str, message_type: MessageType, created_at: datetime)`
  - `PrivateNote(id: UUID, conversation_id: UUID, agent_id: UUID, content: str, created_at: datetime)`
  - `KnowledgeArticle(id: UUID, org_id: UUID, title: str, content: str, embedding: Vector|None, created_at: datetime, updated_at: datetime)`
  - `BotFlow(id: UUID, org_id: UUID, name: str, flow_data: dict, is_active: bool, created_at: datetime, updated_at: datetime)`
  - `CannedResponse(id: UUID, org_id: UUID, shortcode: str, content: str)`
  - `OrgApiKey(id: UUID, org_id: UUID, provider: LLMProviderEnum, encrypted_key: str, created_at: datetime)`

- [ ] **Step 1: Create Organization model**

```python
# backend/app/models/organization.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    widget_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    agents = relationship("Agent", back_populates="organization")
    contacts = relationship("Contact", back_populates="organization")
    conversations = relationship("Conversation", back_populates="organization")
    bot_flows = relationship("BotFlow", back_populates="organization")
    knowledge_articles = relationship("KnowledgeArticle", back_populates="organization")
    canned_responses = relationship("CannedResponse", back_populates="organization")
    api_keys = relationship("OrgApiKey", back_populates="organization")
```

- [ ] **Step 2: Create Agent model**

```python
# backend/app/models/agent.py
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AgentRole(str, enum.Enum):
    admin = "admin"
    agent = "agent"


class AgentStatus(str, enum.Enum):
    online = "online"
    away = "away"
    offline = "offline"


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    email: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[AgentRole] = mapped_column(Enum(AgentRole), default=AgentRole.agent)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[AgentStatus] = mapped_column(Enum(AgentStatus), default=AgentStatus.offline)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="agents")

    __table_args__ = (
        # unique email per org
        {"comment": "unique constraint on (org_id, email) added via migration"},
    )
```

- [ ] **Step 3: Create Contact model**

```python
# backend/app/models/contact.py
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    locale: Mapped[str | None] = mapped_column(String(10), nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="contacts")
    conversations = relationship("Conversation", back_populates="contact")
```

- [ ] **Step 4: Create Conversation model**

```python
# backend/app/models/conversation.py
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConversationStatus(str, enum.Enum):
    open = "open"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"


class Priority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    assigned_agent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    subject: Mapped[str] = mapped_column(String(500), default="New conversation")
    status: Mapped[ConversationStatus] = mapped_column(Enum(ConversationStatus), default=ConversationStatus.open)
    channel: Mapped[str] = mapped_column(String(50), default="widget")
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.normal)
    flow_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="conversations")
    contact = relationship("Contact", back_populates="conversations")
    assigned_agent = relationship("Agent", foreign_keys=[assigned_agent_id])
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")
    private_notes = relationship("PrivateNote", back_populates="conversation")
```

- [ ] **Step 5: Create Message model**

```python
# backend/app/models/message.py
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SenderType(str, enum.Enum):
    contact = "contact"
    agent = "agent"
    bot = "bot"


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    system = "system"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"), index=True)
    sender_type: Mapped[SenderType] = mapped_column(Enum(SenderType))
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    content: Mapped[str] = mapped_column(Text)
    message_type: Mapped[MessageType] = mapped_column(Enum(MessageType), default=MessageType.text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
```

- [ ] **Step 6: Create PrivateNote model**

```python
# backend/app/models/private_note.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PrivateNote(Base):
    __tablename__ = "private_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"), index=True)
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="private_notes")
    agent = relationship("Agent")
```

- [ ] **Step 7: Create KnowledgeArticle model**

```python
# backend/app/models/knowledge_article.py
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    content: Mapped[str] = mapped_column(Text)
    embedding = mapped_column(Vector(1536), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="knowledge_articles")
```

- [ ] **Step 8: Create BotFlow, CannedResponse, OrgApiKey models**

```python
# backend/app/models/bot_flow.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BotFlow(Base):
    __tablename__ = "bot_flows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    flow_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="bot_flows")
```

```python
# backend/app/models/canned_response.py
import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CannedResponse(Base):
    __tablename__ = "canned_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    shortcode: Mapped[str] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)

    organization = relationship("Organization", back_populates="canned_responses")
```

```python
# backend/app/models/org_api_key.py
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LLMProviderEnum(str, enum.Enum):
    claude = "claude"
    openai = "openai"


class OrgApiKey(Base):
    __tablename__ = "org_api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    provider: Mapped[LLMProviderEnum] = mapped_column(Enum(LLMProviderEnum))
    encrypted_key: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="api_keys")
```

- [ ] **Step 9: Create models __init__.py**

```python
# backend/app/models/__init__.py
from app.models.agent import Agent, AgentRole, AgentStatus
from app.models.bot_flow import BotFlow
from app.models.canned_response import CannedResponse
from app.models.contact import Contact
from app.models.conversation import Conversation, ConversationStatus, Priority
from app.models.knowledge_article import KnowledgeArticle
from app.models.message import Message, MessageType, SenderType
from app.models.org_api_key import LLMProviderEnum, OrgApiKey
from app.models.organization import Organization
from app.models.private_note import PrivateNote

__all__ = [
    "Organization",
    "Agent", "AgentRole", "AgentStatus",
    "Contact",
    "Conversation", "ConversationStatus", "Priority",
    "Message", "SenderType", "MessageType",
    "PrivateNote",
    "KnowledgeArticle",
    "BotFlow",
    "CannedResponse",
    "OrgApiKey", "LLMProviderEnum",
]
```

- [ ] **Step 10: Commit models**

```bash
git add backend/app/models/
git commit -m "feat: add all SQLAlchemy models for multi-tenant data layer"
```

---

### Task 3: Alembic Setup + Initial Migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Generate: `backend/alembic/versions/<auto>_initial.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_models.py`

**Interfaces:**
- Consumes: `app.database.Base`, all models from `app.models`, `app.config.settings`
- Produces:
  - Working Alembic migration that creates all tables + pgvector extension
  - `backend/tests/conftest.py` with `db_session`, `client`, `test_org`, `test_agent` fixtures

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend && alembic init alembic
```

- [ ] **Step 2: Update alembic.ini — set sqlalchemy.url to empty (env.py handles it)**

In `backend/alembic.ini`, set:
```ini
sqlalchemy.url =
```

- [ ] **Step 3: Write alembic/env.py**

```python
# backend/alembic/env.py
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import settings
from app.database import Base
import app.models  # noqa: F401 — registers all models with Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Generate and run initial migration**

```bash
cd backend && alembic revision --autogenerate -m "initial schema"
```

Edit the generated migration to add pgvector extension at the top of `upgrade()`:

```python
from alembic import op

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    # ... rest of auto-generated operations
```

Then add unique constraint for (org_id, email) on agents table:

```python
    op.create_unique_constraint("uq_agents_org_email", "agents", ["org_id", "email"])
```

Run it:

```bash
cd backend && alembic upgrade head
```

Expected: all tables created in `customer_support` database.

- [ ] **Step 5: Write test fixtures**

```python
# backend/tests/conftest.py
import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import Agent, AgentRole, Organization

TEST_DB_URL = settings.DATABASE_URL + "_test"
test_engine = create_async_engine(TEST_DB_URL)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def test_org(db_session: AsyncSession):
    org = Organization(name="Test Corp", slug="test-corp")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def test_agent(db_session: AsyncSession, test_org: Organization):
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"])
    agent = Agent(
        org_id=test_org.id,
        email="admin@test.com",
        password_hash=pwd.hash("password123"),
        name="Test Admin",
        role=AgentRole.admin,
        is_verified=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


async def override_get_db():
    async with TestSession() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 6: Write smoke test**

```python
# backend/tests/test_models.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 7: Create test DB and run tests**

```bash
# Create test database (run once)
docker exec -it docker-postgres-1 psql -U postgres -c "CREATE DATABASE customer_support_test;"
docker exec -it docker-postgres-1 psql -U postgres -d customer_support_test -c "CREATE EXTENSION IF NOT EXISTS vector;"

cd backend && python -m pytest tests/test_models.py -v
# Expected: 1 passed
```

- [ ] **Step 8: Commit**

```bash
git add backend/alembic/ backend/alembic.ini backend/tests/
git commit -m "feat: Alembic migrations + test fixtures + smoke test"
```

---

## Phase 2: Auth System

**Branch:** `phase-2/auth`

**Deliverable:** Org registration, agent login with JWT, agent invite flow, email verification.

---

### Task 4: Encryption Service + Pydantic Schemas

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/encryption.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/organization.py`
- Create: `backend/app/schemas/agent.py`

**Interfaces:**
- Consumes: `app.config.settings.ENCRYPTION_KEY`
- Produces:
  - `encryption.encrypt(plaintext: str) -> str` — AES-GCM encryption, returns base64
  - `encryption.decrypt(ciphertext: str) -> str` — AES-GCM decryption
  - Pydantic schemas:
    - `auth.RegisterRequest(org_name: str, org_slug: str, email: str, password: str, name: str)`
    - `auth.LoginRequest(email: str, password: str, org_slug: str)`
    - `auth.TokenResponse(access_token: str, refresh_token: str, token_type: str)`
    - `auth.InviteRequest(email: str, name: str, role: AgentRole)`
    - `organization.OrgResponse(id: UUID, name: str, slug: str, widget_config: dict, created_at: datetime)`
    - `agent.AgentResponse(id: UUID, org_id: UUID, email: str, name: str, role: str, avatar_url: str|None, status: str, created_at: datetime)`

- [ ] **Step 1: Create encryption service**

```python
# backend/app/services/__init__.py
```

```python
# backend/app/services/encryption.py
import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings

_key = bytes.fromhex(settings.ENCRYPTION_KEY)


def encrypt(plaintext: str) -> str:
    nonce = os.urandom(12)
    ct = AESGCM(_key).encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt(ciphertext: str) -> str:
    raw = base64.b64decode(ciphertext)
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(_key).decrypt(nonce, ct, None).decode()
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/app/schemas/__init__.py
```

```python
# backend/app/schemas/auth.py
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.agent import AgentRole


class RegisterRequest(BaseModel):
    org_name: str
    org_slug: str
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    org_slug: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class InviteRequest(BaseModel):
    email: EmailStr
    name: str
    role: AgentRole = AgentRole.agent
```

```python
# backend/app/schemas/organization.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class OrgResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    widget_config: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgUpdateRequest(BaseModel):
    name: str | None = None
    widget_config: dict | None = None
```

```python
# backend/app/schemas/agent.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class AgentResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str
    role: str
    avatar_url: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentUpdateRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    status: str | None = None
```

- [ ] **Step 3: Write test for encryption**

```python
# Add to backend/tests/test_models.py (or create test_encryption.py)

from app.services.encryption import decrypt, encrypt


def test_encrypt_decrypt():
    original = "sk-test-api-key-12345"
    encrypted = encrypt(original)
    assert encrypted != original
    assert decrypt(encrypted) == original
```

- [ ] **Step 4: Run test**

```bash
cd backend && python -m pytest tests/test_models.py -v
# Expected: 2 passed
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/ backend/app/schemas/
git commit -m "feat: encryption service + auth/org/agent Pydantic schemas"
```

---

### Task 5: Auth API — Register, Login, JWT

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/auth.py`
- Modify: `backend/app/main.py` — add router include
- Create: `backend/tests/test_auth.py`

**Interfaces:**
- Consumes: `app.models.Organization`, `app.models.Agent`, `app.schemas.auth.*`, `app.database.get_db`, `app.config.settings.JWT_SECRET`
- Produces:
  - `POST /api/auth/register` → `TokenResponse` (creates org + admin agent)
  - `POST /api/auth/login` → `TokenResponse`
  - `POST /api/auth/refresh` → `TokenResponse`
  - `deps.get_current_agent(token, db) -> Agent` — FastAPI dependency, decodes JWT, returns agent
  - `deps.require_admin(agent) -> Agent` — FastAPI dependency, raises 403 if not admin

- [ ] **Step 1: Write failing auth tests**

```python
# backend/tests/test_auth.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "org_name": "Acme Corp",
        "org_slug": "acme-corp",
        "email": "founder@acme.com",
        "password": "securepass123",
        "name": "Jane Founder",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_slug(client: AsyncClient):
    payload = {
        "org_name": "Dup Corp",
        "org_slug": "dup-corp",
        "email": "a@dup.com",
        "password": "pass123",
        "name": "A",
    }
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json={**payload, "email": "b@dup.com"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Login Co",
        "org_slug": "login-co",
        "email": "user@login.com",
        "password": "pass123",
        "name": "User",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "user@login.com",
        "password": "pass123",
        "org_slug": "login-co",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Wrong Co",
        "org_slug": "wrong-co",
        "email": "user@wrong.com",
        "password": "right",
        "name": "User",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "user@wrong.com",
        "password": "wrong",
        "org_slug": "wrong-co",
    })
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && python -m pytest tests/test_auth.py -v
# Expected: FAILED (no route /api/auth/register)
```

- [ ] **Step 3: Create deps.py**

```python
# backend/app/api/__init__.py
```

```python
# backend/app/api/deps.py
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Agent

security = HTTPBearer()

ALGORITHM = "HS256"


def create_access_token(agent_id: uuid.UUID, org_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRY_MINUTES)
    return jwt.encode(
        {"sub": str(agent_id), "org": str(org_id), "exp": expire, "type": "access"},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


def create_refresh_token(agent_id: uuid.UUID, org_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS)
    return jwt.encode(
        {"sub": str(agent_id), "org": str(org_id), "exp": expire, "type": "refresh"},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


async def get_current_agent(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        agent_id = uuid.UUID(payload["sub"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent not found")
    return agent


async def require_admin(agent: Agent = Depends(get_current_agent)) -> Agent:
    if agent.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    return agent
```

- [ ] **Step 4: Create auth.py router**

```python
# backend/app/api/auth.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Agent, AgentRole, Organization
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.api.deps import ALGORITHM, create_access_token, create_refresh_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Organization).where(Organization.slug == req.org_slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization slug taken")

    org = Organization(name=req.org_name, slug=req.org_slug)
    db.add(org)
    await db.flush()

    agent = Agent(
        org_id=org.id,
        email=req.email,
        password_hash=pwd_context.hash(req.password),
        name=req.name,
        role=AgentRole.admin,
        is_verified=True,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    return TokenResponse(
        access_token=create_access_token(agent.id, org.id),
        refresh_token=create_refresh_token(agent.id, org.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    org_result = await db.execute(select(Organization).where(Organization.slug == req.org_slug))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    agent_result = await db.execute(
        select(Agent).where(Agent.org_id == org.id, Agent.email == req.email)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent or not pwd_context.verify(req.password, agent.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(agent.id, org.id),
        refresh_token=create_refresh_token(agent.id, org.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        agent_id = uuid.UUID(payload["sub"])
        org_id = uuid.UUID(payload["org"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent not found")

    return TokenResponse(
        access_token=create_access_token(agent_id, org_id),
        refresh_token=create_refresh_token(agent_id, org_id),
    )
```

- [ ] **Step 5: Wire router into main.py**

Add to `backend/app/main.py` after CORS middleware:

```python
from app.api.auth import router as auth_router

app.include_router(auth_router)
```

- [ ] **Step 6: Run tests**

```bash
cd backend && python -m pytest tests/test_auth.py -v
# Expected: 4 passed
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/ backend/tests/test_auth.py backend/app/main.py
git commit -m "feat: auth API — register, login, JWT with refresh tokens"
```

---

### Task 6: Agent Invite + Email Service

**Files:**
- Create: `backend/app/services/email.py`
- Modify: `backend/app/api/auth.py` — add `/invite` and `/verify` endpoints
- Modify: `backend/tests/test_auth.py` — add invite tests

**Interfaces:**
- Consumes: `deps.require_admin`, `app.models.Agent`, `app.services.email`
- Produces:
  - `POST /api/auth/invite` (admin-only) → `{"message": "Invite sent"}` — creates unverified agent, sends email
  - `POST /api/auth/accept-invite` → `TokenResponse` — sets password, marks verified
  - `email.send_invite_email(to: str, org_name: str, invite_token: str)` — sends via SMTP

- [ ] **Step 1: Create email service**

```python
# backend/app/services/email.py
import aiosmtplib
from email.message import EmailMessage

from app.config import settings


async def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = "noreply@support.local"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    await aiosmtplib.send(msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT)


async def send_invite_email(to: str, org_name: str, invite_token: str):
    body = f"You've been invited to join {org_name}.\n\nAccept: http://localhost:3000/accept-invite?token={invite_token}"
    await send_email(to, f"Invitation to join {org_name}", body)


async def send_verification_email(to: str, token: str):
    body = f"Verify your email: http://localhost:3000/verify?token={token}"
    await send_email(to, "Verify your email", body)
```

- [ ] **Step 2: Add invite + accept endpoints to auth.py**

Append to `backend/app/api/auth.py`:

```python
from app.api.deps import require_admin
from app.schemas.auth import InviteRequest
from app.services.email import send_invite_email


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


@router.post("/invite")
async def invite_agent(
    req: InviteRequest,
    admin: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Agent).where(Agent.org_id == admin.org_id, Agent.email == req.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent already exists")

    agent = Agent(
        org_id=admin.org_id,
        email=req.email,
        password_hash="",
        name=req.name,
        role=req.role,
        is_verified=False,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    invite_token = create_access_token(agent.id, admin.org_id)
    org_result = await db.execute(select(Organization).where(Organization.id == admin.org_id))
    org = org_result.scalar_one()
    await send_invite_email(req.email, org.name, invite_token)

    return {"message": "Invite sent"}


@router.post("/accept-invite", response_model=TokenResponse)
async def accept_invite(req: AcceptInviteRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        agent_id = uuid.UUID(payload["sub"])
        org_id = uuid.UUID(payload["org"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid invite token")

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent or agent.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used invite")

    agent.password_hash = pwd_context.hash(req.password)
    agent.is_verified = True
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(agent.id, org_id),
        refresh_token=create_refresh_token(agent.id, org_id),
    )
```

Add needed import at top:
```python
from pydantic import BaseModel
```

- [ ] **Step 3: Add invite test**

Append to `backend/tests/test_auth.py`:

```python
@pytest.mark.asyncio
async def test_invite_agent(client: AsyncClient):
    # Register admin
    reg = await client.post("/api/auth/register", json={
        "org_name": "Invite Co",
        "org_slug": "invite-co",
        "email": "admin@invite.com",
        "password": "pass123",
        "name": "Admin",
    })
    token = reg.json()["access_token"]

    # Invite agent
    resp = await client.post(
        "/api/auth/invite",
        json={"email": "agent@invite.com", "name": "Agent", "role": "agent"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Invite sent"
```

- [ ] **Step 4: Run tests**

```bash
cd backend && python -m pytest tests/test_auth.py -v
# Expected: 5 passed
```

- [ ] **Step 5: Commit and merge phase**

```bash
git add backend/
git commit -m "feat: agent invite flow with email service"
git checkout main && git merge phase-2/auth
```

---

## Phase 3: Core REST API

**Branch:** `phase-3/core-api`

**Deliverable:** Full CRUD for contacts, conversations, messages, private notes, canned responses, knowledge articles, and org settings.

---

### Task 7: Remaining Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/contact.py`
- Create: `backend/app/schemas/conversation.py`
- Create: `backend/app/schemas/message.py`
- Create: `backend/app/schemas/private_note.py`
- Create: `backend/app/schemas/knowledge.py`
- Create: `backend/app/schemas/bot_flow.py`
- Create: `backend/app/schemas/canned.py`
- Create: `backend/app/schemas/org_api_key.py`

**Interfaces:**
- Consumes: model enums from `app.models`
- Produces: All Pydantic request/response schemas for every API endpoint in Tasks 8-10

- [ ] **Step 1: Create all remaining schemas**

```python
# backend/app/schemas/contact.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class ContactCreate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    locale: str | None = None
    metadata_: dict = {}
    tags: list[str] = []


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    locale: str | None = None
    metadata_: dict | None = None
    tags: list[str] | None = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str | None
    email: str | None
    phone: str | None
    locale: str | None
    metadata_: dict
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/conversation.py
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.conversation import ConversationStatus, Priority


class ConversationCreate(BaseModel):
    contact_id: uuid.UUID
    subject: str = "New conversation"
    channel: str = "widget"
    priority: Priority = Priority.normal


class ConversationUpdate(BaseModel):
    subject: str | None = None
    status: ConversationStatus | None = None
    priority: Priority | None = None
    assigned_agent_id: uuid.UUID | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    contact_id: uuid.UUID
    assigned_agent_id: uuid.UUID | None
    subject: str
    status: str
    channel: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/message.py
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.message import MessageType, SenderType


class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.text


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    sender_id: uuid.UUID
    content: str
    message_type: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/private_note.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class PrivateNoteCreate(BaseModel):
    content: str


class PrivateNoteResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    agent_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/knowledge.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class KnowledgeArticleCreate(BaseModel):
    title: str
    content: str


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class KnowledgeArticleResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/bot_flow.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class BotFlowCreate(BaseModel):
    name: str
    flow_data: dict = {}


class BotFlowUpdate(BaseModel):
    name: str | None = None
    flow_data: dict | None = None
    is_active: bool | None = None


class BotFlowResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    flow_data: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/canned.py
import uuid

from pydantic import BaseModel


class CannedResponseCreate(BaseModel):
    shortcode: str
    content: str


class CannedResponseUpdate(BaseModel):
    shortcode: str | None = None
    content: str | None = None


class CannedResponseSchema(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    shortcode: str
    content: str

    model_config = {"from_attributes": True}
```

```python
# backend/app/schemas/org_api_key.py
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.org_api_key import LLMProviderEnum


class ApiKeyCreate(BaseModel):
    provider: LLMProviderEnum
    api_key: str


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    provider: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Commit**

```bash
git checkout -b phase-3/core-api
git add backend/app/schemas/
git commit -m "feat: all Pydantic schemas for core API"
```

---

### Task 8: Contacts + Conversations + Messages API

**Files:**
- Create: `backend/app/api/contacts.py`
- Create: `backend/app/api/conversations.py`
- Create: `backend/app/api/messages.py`
- Create: `backend/app/api/private_notes.py`
- Modify: `backend/app/main.py` — add router includes
- Create: `backend/tests/test_conversations.py`

**Interfaces:**
- Consumes: `deps.get_current_agent`, `app.models.*`, `app.schemas.*`
- Produces:
  - Contacts: `GET/POST /api/contacts`, `GET/PUT/DELETE /api/contacts/{id}`
  - Conversations: `GET/POST /api/conversations`, `GET/PUT /api/conversations/{id}`, `PUT /api/conversations/{id}/assign`
  - Messages: `GET /api/conversations/{id}/messages`, `POST /api/conversations/{id}/messages`
  - Private Notes: `GET /api/conversations/{id}/notes`, `POST /api/conversations/{id}/notes`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_conversations.py
import pytest
from httpx import AsyncClient


async def register_and_get_token(client: AsyncClient, slug: str) -> str:
    resp = await client.post("/api/auth/register", json={
        "org_name": f"{slug} Co",
        "org_slug": slug,
        "email": f"admin@{slug}.com",
        "password": "pass123",
        "name": "Admin",
    })
    return resp.json()["access_token"]


def auth(token: str):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_contact_crud(client: AsyncClient):
    token = await register_and_get_token(client, "contact-test")
    h = auth(token)

    # Create
    resp = await client.post("/api/contacts", json={"name": "Alice", "email": "alice@example.com"}, headers=h)
    assert resp.status_code == 201
    contact_id = resp.json()["id"]

    # List
    resp = await client.get("/api/contacts", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # Get
    resp = await client.get(f"/api/contacts/{contact_id}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice"

    # Update
    resp = await client.put(f"/api/contacts/{contact_id}", json={"name": "Alice Updated"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice Updated"


@pytest.mark.asyncio
async def test_conversation_flow(client: AsyncClient):
    token = await register_and_get_token(client, "conv-test")
    h = auth(token)

    # Create contact first
    contact = await client.post("/api/contacts", json={"name": "Bob"}, headers=h)
    contact_id = contact.json()["id"]

    # Create conversation
    resp = await client.post("/api/conversations", json={"contact_id": contact_id, "subject": "Help me"}, headers=h)
    assert resp.status_code == 201
    conv_id = resp.json()["id"]

    # Send message
    resp = await client.post(f"/api/conversations/{conv_id}/messages", json={"content": "Hello!"}, headers=h)
    assert resp.status_code == 201

    # List messages
    resp = await client.get(f"/api/conversations/{conv_id}/messages", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["content"] == "Hello!"

    # Add private note
    resp = await client.post(f"/api/conversations/{conv_id}/notes", json={"content": "Internal note"}, headers=h)
    assert resp.status_code == 201

    # List notes
    resp = await client.get(f"/api/conversations/{conv_id}/notes", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && python -m pytest tests/test_conversations.py -v
# Expected: FAILED (404 on /api/contacts)
```

- [ ] **Step 3: Create contacts.py router**

```python
# backend/app/api/contacts.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Contact
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactResponse])
async def list_contacts(
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Contact).where(Contact.org_id == agent.org_id))
    return result.scalars().all()


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    req: ContactCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    contact = Contact(org_id=agent.org_id, **req.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.org_id == agent.org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: uuid.UUID,
    req: ContactUpdate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.org_id == agent.org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(contact, k, v)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.org_id == agent.org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()
```

- [ ] **Step 4: Create conversations.py router**

```python
# backend/app/api/conversations.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation
from app.schemas.conversation import ConversationCreate, ConversationResponse, ConversationUpdate

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    status_filter: str | None = None,
    assigned_to_me: bool = False,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    q = select(Conversation).where(Conversation.org_id == agent.org_id).order_by(Conversation.updated_at.desc())
    if status_filter:
        q = q.where(Conversation.status == status_filter)
    if assigned_to_me:
        q = q.where(Conversation.assigned_agent_id == agent.id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    req: ConversationCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(org_id=agent.org_id, **req.model_dump())
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.put("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: uuid.UUID,
    req: ConversationUpdate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(conv, k, v)
    await db.commit()
    await db.refresh(conv)
    return conv
```

- [ ] **Step 5: Create messages.py and private_notes.py routers**

```python
# backend/app/api/messages.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation, Message, SenderType
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/conversations/{conv_id}/messages", tags=["messages"])


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    conv_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    conv_id: uuid.UUID,
    req: MessageCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=conv_id,
        sender_type=SenderType.agent,
        sender_id=agent.id,
        content=req.content,
        message_type=req.message_type,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
```

```python
# backend/app/api/private_notes.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation, PrivateNote
from app.schemas.private_note import PrivateNoteCreate, PrivateNoteResponse

router = APIRouter(prefix="/api/conversations/{conv_id}/notes", tags=["private_notes"])


@router.get("", response_model=list[PrivateNoteResponse])
async def list_notes(
    conv_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(PrivateNote).where(PrivateNote.conversation_id == conv_id).order_by(PrivateNote.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=PrivateNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    conv_id: uuid.UUID,
    req: PrivateNoteCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    note = PrivateNote(conversation_id=conv_id, agent_id=agent.id, content=req.content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note
```

- [ ] **Step 6: Wire all routers into main.py**

Add to `backend/app/main.py`:

```python
from app.api.contacts import router as contacts_router
from app.api.conversations import router as conversations_router
from app.api.messages import router as messages_router
from app.api.private_notes import router as private_notes_router

app.include_router(contacts_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(private_notes_router)
```

- [ ] **Step 7: Run tests**

```bash
cd backend && python -m pytest tests/test_conversations.py -v
# Expected: 2 passed
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: contacts, conversations, messages, private notes CRUD API"
```

---

### Task 9: Canned Responses + Knowledge Articles + Org Settings + API Keys

**Files:**
- Create: `backend/app/api/canned.py`
- Create: `backend/app/api/knowledge.py`
- Create: `backend/app/api/bot_flows.py`
- Create: `backend/app/api/org.py`
- Modify: `backend/app/main.py` — add router includes
- Create: `backend/tests/test_org.py`

**Interfaces:**
- Consumes: `deps.get_current_agent`, `deps.require_admin`, `app.services.encryption`
- Produces:
  - Canned: `GET/POST /api/canned`, `PUT/DELETE /api/canned/{id}`
  - Knowledge: `GET/POST /api/knowledge`, `GET/PUT/DELETE /api/knowledge/{id}`
  - Bot Flows: `GET/POST /api/flows`, `GET/PUT/DELETE /api/flows/{id}`, `POST /api/flows/{id}/activate`
  - Org: `GET/PUT /api/org`, `GET/PUT /api/org/widget-config`
  - API Keys: `GET/POST /api/org/api-keys`, `DELETE /api/org/api-keys/{id}`

- [ ] **Step 1: Create canned.py**

```python
# backend/app/api/canned.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, CannedResponse
from app.schemas.canned import CannedResponseCreate, CannedResponseSchema, CannedResponseUpdate

router = APIRouter(prefix="/api/canned", tags=["canned"])


@router.get("", response_model=list[CannedResponseSchema])
async def list_canned(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CannedResponse).where(CannedResponse.org_id == agent.org_id))
    return result.scalars().all()


@router.post("", response_model=CannedResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_canned(
    req: CannedResponseCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    cr = CannedResponse(org_id=agent.org_id, **req.model_dump())
    db.add(cr)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.put("/{canned_id}", response_model=CannedResponseSchema)
async def update_canned(
    canned_id: uuid.UUID, req: CannedResponseUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(CannedResponse.id == canned_id, CannedResponse.org_id == agent.org_id)
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(cr, k, v)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.delete("/{canned_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_canned(
    canned_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(CannedResponse.id == canned_id, CannedResponse.org_id == agent.org_id)
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(cr)
    await db.commit()
```

- [ ] **Step 2: Create knowledge.py**

```python
# backend/app/api/knowledge.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, KnowledgeArticle
from app.schemas.knowledge import KnowledgeArticleCreate, KnowledgeArticleResponse, KnowledgeArticleUpdate

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeArticleResponse])
async def list_articles(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.org_id == agent.org_id).order_by(KnowledgeArticle.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    req: KnowledgeArticleCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    article = KnowledgeArticle(org_id=agent.org_id, title=req.title, content=req.content)
    db.add(article)
    await db.commit()
    await db.refresh(article)
    # ponytail: embedding happens in Phase 4 when AI provider is available
    return article


@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
async def get_article(
    article_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    return article


@router.put("/{article_id}", response_model=KnowledgeArticleResponse)
async def update_article(
    article_id: uuid.UUID, req: KnowledgeArticleUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(article, k, v)
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(article)
    await db.commit()
```

- [ ] **Step 3: Create bot_flows.py**

```python
# backend/app/api/bot_flows.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, BotFlow
from app.schemas.bot_flow import BotFlowCreate, BotFlowResponse, BotFlowUpdate

router = APIRouter(prefix="/api/flows", tags=["bot_flows"])


@router.get("", response_model=list[BotFlowResponse])
async def list_flows(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotFlow).where(BotFlow.org_id == agent.org_id))
    return result.scalars().all()


@router.post("", response_model=BotFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    req: BotFlowCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    flow = BotFlow(org_id=agent.org_id, **req.model_dump())
    db.add(flow)
    await db.commit()
    await db.refresh(flow)
    return flow


@router.get("/{flow_id}", response_model=BotFlowResponse)
async def get_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    return flow


@router.put("/{flow_id}", response_model=BotFlowResponse)
async def update_flow(
    flow_id: uuid.UUID, req: BotFlowUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(flow, k, v)
    await db.commit()
    await db.refresh(flow)
    return flow


@router.post("/{flow_id}/activate", response_model=BotFlowResponse)
async def activate_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    # Deactivate all other flows for this org
    await db.execute(
        update(BotFlow).where(BotFlow.org_id == agent.org_id).values(is_active=False)
    )
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    flow.is_active = True
    await db.commit()
    await db.refresh(flow)
    return flow


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(flow)
    await db.commit()
```

- [ ] **Step 4: Create org.py (settings + API keys)**

```python
# backend/app/api/org.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent, require_admin
from app.database import get_db
from app.models import Agent, Organization, OrgApiKey
from app.schemas.organization import OrgResponse, OrgUpdateRequest
from app.schemas.org_api_key import ApiKeyCreate, ApiKeyResponse
from app.services.encryption import encrypt

router = APIRouter(prefix="/api/org", tags=["organization"])


@router.get("", response_model=OrgResponse)
async def get_org(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == agent.org_id))
    return result.scalar_one()


@router.put("", response_model=OrgResponse)
async def update_org(
    req: OrgUpdateRequest,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == agent.org_id))
    org = result.scalar_one()
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(agent: Agent = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OrgApiKey).where(OrgApiKey.org_id == agent.org_id))
    return result.scalars().all()


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    req: ApiKeyCreate,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Replace existing key for same provider
    existing = await db.execute(
        select(OrgApiKey).where(OrgApiKey.org_id == agent.org_id, OrgApiKey.provider == req.provider)
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    key = OrgApiKey(org_id=agent.org_id, provider=req.provider, encrypted_key=encrypt(req.api_key))
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return key


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: uuid.UUID,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgApiKey).where(OrgApiKey.id == key_id, OrgApiKey.org_id == agent.org_id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(key)
    await db.commit()
```

- [ ] **Step 5: Wire all remaining routers into main.py**

Add to `backend/app/main.py`:

```python
from app.api.canned import router as canned_router
from app.api.knowledge import router as knowledge_router
from app.api.bot_flows import router as bot_flows_router
from app.api.org import router as org_router

app.include_router(canned_router)
app.include_router(knowledge_router)
app.include_router(bot_flows_router)
app.include_router(org_router)
```

- [ ] **Step 6: Write org/API key test**

```python
# backend/tests/test_org.py
import pytest
from httpx import AsyncClient


async def register(client, slug):
    resp = await client.post("/api/auth/register", json={
        "org_name": f"{slug}", "org_slug": slug,
        "email": f"a@{slug}.com", "password": "p", "name": "A",
    })
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_org_settings(client: AsyncClient):
    token = await register(client, "org-test")
    h = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/org", headers=h)
    assert resp.status_code == 200
    assert resp.json()["slug"] == "org-test"

    resp = await client.put("/api/org", json={"widget_config": {"color": "#0066ff"}}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["widget_config"]["color"] == "#0066ff"


@pytest.mark.asyncio
async def test_api_keys(client: AsyncClient):
    token = await register(client, "key-test")
    h = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/org/api-keys", json={"provider": "openai", "api_key": "sk-test"}, headers=h)
    assert resp.status_code == 201
    assert "encrypted_key" not in resp.json()

    resp = await client.get("/api/org/api-keys", headers=h)
    assert len(resp.json()) == 1
```

- [ ] **Step 7: Run all tests**

```bash
cd backend && python -m pytest tests/ -v
# Expected: all passed
```

- [ ] **Step 8: Commit and merge phase**

```bash
git add backend/
git commit -m "feat: full CRUD API — canned responses, knowledge, flows, org settings, API keys"
git checkout main && git merge phase-3/core-api
```

---

## Phase 4: Real-time & AI

**Branch:** `phase-4/realtime-ai`

**Deliverable:** WebSocket connections for widget and agent dashboard, LLM provider abstraction, RAG search, bot flow execution, full AI message pipeline.

---

### Task 10: WebSocket Connection Manager

**Files:**
- Create: `backend/app/ws/__init__.py`
- Create: `backend/app/ws/manager.py`
- Create: `backend/app/ws/widget.py`
- Create: `backend/app/ws/agent.py`
- Modify: `backend/app/main.py` — add WS routes

**Interfaces:**
- Consumes: `app.database.get_db`, `app.models.*`
- Produces:
  - `ConnectionManager` class with:
    - `connect_widget(ws, org_slug, conversation_id) -> None`
    - `connect_agent(ws, org_id, agent_id) -> None`
    - `disconnect_widget(org_slug, conversation_id)`
    - `disconnect_agent(org_id, agent_id)`
    - `send_to_conversation(org_slug, conversation_id, message: dict)`
    - `broadcast_to_agents(org_id, message: dict)`
  - `WS /ws/widget/{org_slug}` — widget endpoint
  - `WS /ws/agent/{org_id}` — agent dashboard endpoint

- [ ] **Step 1: Create ConnectionManager**

```python
# backend/app/ws/__init__.py
```

```python
# backend/app/ws/manager.py
import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # org_slug -> {conversation_id -> WebSocket}
        self.widget_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)
        # org_id -> {agent_id -> WebSocket}
        self.agent_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    async def connect_widget(self, ws: WebSocket, org_slug: str, conversation_id: str):
        await ws.accept()
        self.widget_connections[org_slug][conversation_id] = ws

    async def connect_agent(self, ws: WebSocket, org_id: str, agent_id: str):
        await ws.accept()
        self.agent_connections[org_id][agent_id] = ws

    def disconnect_widget(self, org_slug: str, conversation_id: str):
        self.widget_connections[org_slug].pop(conversation_id, None)

    def disconnect_agent(self, org_id: str, agent_id: str):
        self.agent_connections[org_id].pop(agent_id, None)

    async def send_to_conversation(self, org_slug: str, conversation_id: str, message: dict):
        ws = self.widget_connections.get(org_slug, {}).get(conversation_id)
        if ws:
            await ws.send_json(message)

    async def broadcast_to_agents(self, org_id: str, message: dict):
        for ws in self.agent_connections.get(org_id, {}).values():
            await ws.send_json(message)


manager = ConnectionManager()
```

- [ ] **Step 2: Create widget WebSocket endpoint**

```python
# backend/app/ws/widget.py
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import Contact, Conversation, Message, Organization, SenderType
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/widget/{org_slug}")
async def widget_ws(ws: WebSocket, org_slug: str):
    async with AsyncSessionLocal() as db:
        org_result = await db.execute(select(Organization).where(Organization.slug == org_slug))
        org = org_result.scalar_one_or_none()
        if not org:
            await ws.close(code=4004, reason="Organization not found")
            return

    conversation_id = None
    await manager.connect_widget(ws, org_slug, "pending")

    try:
        while True:
            data = await ws.receive_json()
            action = data.get("action")

            if action == "start":
                async with AsyncSessionLocal() as db:
                    org_result = await db.execute(select(Organization).where(Organization.slug == org_slug))
                    org = org_result.scalar_one()

                    # Resume or create conversation
                    resume_id = data.get("conversation_id")
                    if resume_id:
                        conv_result = await db.execute(
                            select(Conversation).where(
                                Conversation.id == uuid.UUID(resume_id),
                                Conversation.org_id == org.id,
                            )
                        )
                        conv = conv_result.scalar_one_or_none()
                        if conv:
                            conversation_id = str(conv.id)
                            manager.disconnect_widget(org_slug, "pending")
                            await manager.connect_widget(ws, org_slug, conversation_id)

                            # Send history
                            msg_result = await db.execute(
                                select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
                            )
                            messages = msg_result.scalars().all()
                            await ws.send_json({
                                "type": "history",
                                "conversation_id": conversation_id,
                                "messages": [
                                    {"sender_type": m.sender_type.value, "content": m.content, "created_at": m.created_at.isoformat()}
                                    for m in messages
                                ],
                            })
                            continue

                    # Create new contact + conversation
                    contact = Contact(
                        org_id=org.id,
                        name=data.get("name"),
                        email=data.get("email"),
                    )
                    db.add(contact)
                    await db.flush()

                    conv = Conversation(org_id=org.id, contact_id=contact.id, channel="widget")
                    db.add(conv)
                    await db.commit()
                    await db.refresh(conv)

                    conversation_id = str(conv.id)
                    manager.disconnect_widget(org_slug, "pending")
                    await manager.connect_widget(ws, org_slug, conversation_id)

                    await ws.send_json({"type": "conversation_started", "conversation_id": conversation_id})

                    # Notify agents
                    await manager.broadcast_to_agents(str(org.id), {
                        "type": "new_conversation",
                        "conversation_id": conversation_id,
                        "contact_name": contact.name,
                    })

                    # Send welcome message from bot
                    greeting = org.widget_config.get("greeting", "Hello! How can I help you today?")
                    bot_msg = Message(
                        conversation_id=conv.id,
                        sender_type=SenderType.bot,
                        sender_id=conv.id,
                        content=greeting,
                    )
                    db.add(bot_msg)
                    await db.commit()
                    await ws.send_json({
                        "type": "message",
                        "sender_type": "bot",
                        "content": greeting,
                    })

            elif action == "message" and conversation_id:
                content = data.get("content", "")
                async with AsyncSessionLocal() as db:
                    org_result = await db.execute(select(Organization).where(Organization.slug == org_slug))
                    org = org_result.scalar_one()

                    # Save customer message
                    conv_result = await db.execute(
                        select(Conversation).where(Conversation.id == uuid.UUID(conversation_id))
                    )
                    conv = conv_result.scalar_one()

                    msg = Message(
                        conversation_id=conv.id,
                        sender_type=SenderType.contact,
                        sender_id=conv.contact_id,
                        content=content,
                    )
                    db.add(msg)
                    await db.commit()

                    # Notify agents
                    await manager.broadcast_to_agents(str(org.id), {
                        "type": "new_message",
                        "conversation_id": conversation_id,
                        "sender_type": "contact",
                        "content": content,
                    })

                    # AI response will be handled by pipeline in Task 12
                    # ponytail: for now, echo acknowledgment
                    await ws.send_json({
                        "type": "message",
                        "sender_type": "bot",
                        "content": "Thanks for your message. Let me look into that for you.",
                    })

            elif action == "typing" and conversation_id:
                async with AsyncSessionLocal() as db:
                    org_result = await db.execute(select(Organization).where(Organization.slug == org_slug))
                    org = org_result.scalar_one()
                await manager.broadcast_to_agents(str(org.id), {
                    "type": "typing",
                    "conversation_id": conversation_id,
                    "is_typing": data.get("is_typing", False),
                })

    except WebSocketDisconnect:
        if conversation_id:
            manager.disconnect_widget(org_slug, conversation_id)
        else:
            manager.disconnect_widget(org_slug, "pending")
```

- [ ] **Step 3: Create agent WebSocket endpoint**

```python
# backend/app/ws/agent.py
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.api.deps import ALGORITHM
from app.database import AsyncSessionLocal
from app.models import Agent, Conversation, Message, Organization, SenderType
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/agent/{org_id}")
async def agent_ws(ws: WebSocket, org_id: str):
    # Authenticate via query param token
    token = ws.query_params.get("token")
    if not token:
        await ws.close(code=4001, reason="Token required")
        return

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        agent_id = payload["sub"]
        token_org = payload["org"]
        if token_org != org_id:
            await ws.close(code=4003, reason="Org mismatch")
            return
    except (JWTError, KeyError):
        await ws.close(code=4001, reason="Invalid token")
        return

    await manager.connect_agent(ws, org_id, agent_id)

    try:
        while True:
            data = await ws.receive_json()
            action = data.get("action")

            if action == "message":
                conv_id = data.get("conversation_id")
                content = data.get("content", "")

                async with AsyncSessionLocal() as db:
                    conv_result = await db.execute(
                        select(Conversation).where(
                            Conversation.id == uuid.UUID(conv_id),
                            Conversation.org_id == uuid.UUID(org_id),
                        )
                    )
                    conv = conv_result.scalar_one_or_none()
                    if not conv:
                        continue

                    msg = Message(
                        conversation_id=conv.id,
                        sender_type=SenderType.agent,
                        sender_id=uuid.UUID(agent_id),
                        content=content,
                    )
                    db.add(msg)
                    await db.commit()

                    # Send to widget
                    org_result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
                    org = org_result.scalar_one()
                    await manager.send_to_conversation(org.slug, conv_id, {
                        "type": "message",
                        "sender_type": "agent",
                        "content": content,
                    })

                    # Broadcast to other agents
                    await manager.broadcast_to_agents(org_id, {
                        "type": "new_message",
                        "conversation_id": conv_id,
                        "sender_type": "agent",
                        "sender_id": agent_id,
                        "content": content,
                    })

            elif action == "typing":
                conv_id = data.get("conversation_id")
                async with AsyncSessionLocal() as db:
                    org_result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
                    org = org_result.scalar_one()
                await manager.send_to_conversation(org.slug, conv_id, {
                    "type": "typing",
                    "is_typing": data.get("is_typing", False),
                })

            elif action == "assign":
                conv_id = data.get("conversation_id")
                async with AsyncSessionLocal() as db:
                    conv_result = await db.execute(
                        select(Conversation).where(
                            Conversation.id == uuid.UUID(conv_id),
                            Conversation.org_id == uuid.UUID(org_id),
                        )
                    )
                    conv = conv_result.scalar_one_or_none()
                    if conv:
                        conv.assigned_agent_id = uuid.UUID(agent_id)
                        await db.commit()

                await manager.broadcast_to_agents(org_id, {
                    "type": "assignment_changed",
                    "conversation_id": conv_id,
                    "assigned_agent_id": agent_id,
                })

    except WebSocketDisconnect:
        manager.disconnect_agent(org_id, agent_id)
```

- [ ] **Step 4: Wire WS routes into main.py**

Add to `backend/app/main.py`:

```python
from app.ws.widget import router as ws_widget_router
from app.ws.agent import router as ws_agent_router

app.include_router(ws_widget_router)
app.include_router(ws_agent_router)
```

- [ ] **Step 5: Commit**

```bash
git checkout -b phase-4/realtime-ai
git add backend/app/ws/ backend/app/main.py
git commit -m "feat: WebSocket endpoints for widget and agent dashboard"
```

---

### Task 11: LLM Provider Abstraction + RAG

**Files:**
- Create: `backend/app/ai/__init__.py`
- Create: `backend/app/ai/provider.py`
- Create: `backend/app/ai/rag.py`
- Create: `backend/tests/test_ai_pipeline.py`

**Interfaces:**
- Consumes: `app.models.OrgApiKey`, `app.models.KnowledgeArticle`, `app.services.encryption.decrypt`
- Produces:
  - `LLMProvider` ABC with `generate()` and `embed()`
  - `ClaudeProvider(api_key: str)` and `OpenAIProvider(api_key: str)`
  - `get_provider_for_org(org_id: UUID, db: AsyncSession) -> LLMProvider`
  - `rag.search_knowledge(org_id: UUID, query: str, db: AsyncSession, provider: LLMProvider, top_k: int = 3) -> list[str]`
  - `rag.embed_article(article: KnowledgeArticle, db: AsyncSession, provider: LLMProvider)`

- [ ] **Step 1: Create LLM provider abstraction**

```python
# backend/app/ai/__init__.py
```

```python
# backend/app/ai/provider.py
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

import anthropic
import openai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OrgApiKey
from app.services.encryption import decrypt


@dataclass
class LLMResponse:
    content: str
    intent: str  # "can_handle", "needs_human", "unclear"


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list[dict], system_prompt: str) -> LLMResponse: ...

    @abstractmethod
    async def embed(self, text: str) -> list[float]: ...


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def generate(self, messages: list[dict], system_prompt: str) -> LLMResponse:
        resp = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        content = resp.content[0].text

        # Parse intent from structured response
        intent = "can_handle"
        if "[NEEDS_HUMAN]" in content:
            intent = "needs_human"
            content = content.replace("[NEEDS_HUMAN]", "").strip()
        elif "[UNCLEAR]" in content:
            intent = "unclear"
            content = content.replace("[UNCLEAR]", "").strip()

        return LLMResponse(content=content, intent=intent)

    async def embed(self, text: str) -> list[float]:
        # ponytail: Claude doesn't have an embed API; use Voyage via Anthropic's recommendation
        # For now, fall back to a simple hash-based embedding for dev
        # Replace with real embedding provider when ready
        import hashlib
        h = hashlib.sha256(text.encode()).hexdigest()
        return [int(h[i:i+2], 16) / 255.0 for i in range(0, min(len(h), 3072), 2)]


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def generate(self, messages: list[dict], system_prompt: str) -> LLMResponse:
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        resp = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=full_messages,
            max_tokens=1024,
        )
        content = resp.choices[0].message.content

        intent = "can_handle"
        if "[NEEDS_HUMAN]" in content:
            intent = "needs_human"
            content = content.replace("[NEEDS_HUMAN]", "").strip()
        elif "[UNCLEAR]" in content:
            intent = "unclear"
            content = content.replace("[UNCLEAR]", "").strip()

        return LLMResponse(content=content, intent=intent)

    async def embed(self, text: str) -> list[float]:
        resp = await self.client.embeddings.create(model="text-embedding-3-small", input=text)
        return resp.data[0].embedding


async def get_provider_for_org(org_id: uuid.UUID, db: AsyncSession) -> LLMProvider | None:
    result = await db.execute(select(OrgApiKey).where(OrgApiKey.org_id == org_id))
    key_record = result.scalar_one_or_none()
    if not key_record:
        return None

    api_key = decrypt(key_record.encrypted_key)
    if key_record.provider.value == "claude":
        return ClaudeProvider(api_key)
    return OpenAIProvider(api_key)
```

- [ ] **Step 2: Create RAG module**

```python
# backend/app/ai/rag.py
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.provider import LLMProvider
from app.models import KnowledgeArticle


async def embed_article(article: KnowledgeArticle, db: AsyncSession, provider: LLMProvider):
    embedding = await provider.embed(f"{article.title}\n{article.content}")
    article.embedding = embedding
    await db.commit()


async def search_knowledge(
    org_id: uuid.UUID,
    query: str,
    db: AsyncSession,
    provider: LLMProvider,
    top_k: int = 3,
) -> list[str]:
    query_embedding = await provider.embed(query)

    result = await db.execute(
        select(KnowledgeArticle.title, KnowledgeArticle.content)
        .where(
            KnowledgeArticle.org_id == org_id,
            KnowledgeArticle.embedding.is_not(None),
        )
        .order_by(KnowledgeArticle.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )
    rows = result.all()
    return [f"## {row.title}\n{row.content}" for row in rows]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/ai/
git commit -m "feat: LLM provider abstraction (Claude + OpenAI) + RAG search"
```

---

### Task 12: AI Message Pipeline + Bot Flow Engine

**Files:**
- Create: `backend/app/ai/bot_engine.py`
- Create: `backend/app/ai/pipeline.py`
- Modify: `backend/app/ws/widget.py` — replace echo with AI pipeline
- Create: `backend/tests/test_ai_pipeline.py`

**Interfaces:**
- Consumes: `app.ai.provider.get_provider_for_org`, `app.ai.rag.search_knowledge`, `app.models.*`
- Produces:
  - `bot_engine.execute_flow_step(conv: Conversation, message: str, db: AsyncSession) -> str | None` — returns bot response or None if flow complete
  - `pipeline.process_customer_message(org_id: UUID, conv_id: UUID, content: str, db: AsyncSession) -> PipelineResult`
  - `PipelineResult(response: str, intent: str, escalated: bool)`

- [ ] **Step 1: Create bot_engine.py**

```python
# backend/app/ai/bot_engine.py
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BotFlow, Conversation


async def get_active_flow(org_id: uuid.UUID, db: AsyncSession) -> BotFlow | None:
    result = await db.execute(
        select(BotFlow).where(BotFlow.org_id == org_id, BotFlow.is_active == True)
    )
    return result.scalar_one_or_none()


async def execute_flow_step(
    conv: Conversation,
    message: str,
    db: AsyncSession,
) -> str | None:
    """Walk the bot flow graph one step. Returns response text or None if no active flow."""
    flow = await get_active_flow(conv.org_id, db)
    if not flow or not flow.flow_data:
        return None

    nodes = flow.flow_data.get("nodes", [])
    edges = flow.flow_data.get("edges", [])
    if not nodes:
        return None

    state = conv.flow_state or {}
    current_node_id = state.get("current_node_id")
    collected = state.get("collected", {})

    if not current_node_id:
        # Start at first node
        trigger_nodes = [n for n in nodes if n.get("type") == "trigger"]
        if not trigger_nodes:
            return None
        current_node_id = trigger_nodes[0]["id"]

    current_node = next((n for n in nodes if n["id"] == current_node_id), None)
    if not current_node:
        return None

    node_type = current_node.get("type", "")
    node_data = current_node.get("data", {})

    # Process based on node type
    response = None

    if node_type == "trigger":
        # Move to next node
        next_id = _find_next(current_node_id, edges)
        conv.flow_state = {"current_node_id": next_id, "collected": collected}
        await db.commit()
        if next_id:
            return await _process_node(next_id, nodes, edges, conv, collected, db)
        return None

    elif node_type == "bot_response":
        response = node_data.get("message", "")
        collect_key = node_data.get("collect_as")
        if collect_key:
            collected[collect_key] = message

        next_id = _find_next(current_node_id, edges)
        conv.flow_state = {"current_node_id": next_id, "collected": collected}
        await db.commit()
        return response

    elif node_type == "condition":
        condition_field = node_data.get("field", "")
        condition_value = collected.get(condition_field, message)

        # Find success/failure edges
        success_edge = next((e for e in edges if e["source"] == current_node_id and e.get("sourceHandle") == "success"), None)
        failure_edge = next((e for e in edges if e["source"] == current_node_id and e.get("sourceHandle") == "failure"), None)

        next_id = success_edge["target"] if success_edge and condition_value else (failure_edge["target"] if failure_edge else None)
        conv.flow_state = {"current_node_id": next_id, "collected": collected}
        await db.commit()
        if next_id:
            return await _process_node(next_id, nodes, edges, conv, collected, db)

    elif node_type == "action":
        action_type = node_data.get("action_type", "")
        if action_type == "escalate":
            conv.flow_state = None
            conv.assigned_agent_id = None  # Goes to unassigned queue
            await db.commit()
            return node_data.get("message", "I'll connect you with our support team.")

        next_id = _find_next(current_node_id, edges)
        conv.flow_state = {"current_node_id": next_id, "collected": collected}
        await db.commit()

    return response


async def _process_node(node_id, nodes, edges, conv, collected, db):
    node = next((n for n in nodes if n["id"] == node_id), None)
    if not node:
        return None
    if node.get("type") == "bot_response":
        return node.get("data", {}).get("message", "")
    return None


def _find_next(node_id: str, edges: list) -> str | None:
    edge = next((e for e in edges if e["source"] == node_id), None)
    return edge["target"] if edge else None
```

- [ ] **Step 2: Create pipeline.py**

```python
# backend/app/ai/pipeline.py
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.bot_engine import execute_flow_step
from app.ai.provider import get_provider_for_org
from app.ai.rag import search_knowledge
from app.models import Conversation, Message, Organization


@dataclass
class PipelineResult:
    response: str
    intent: str  # can_handle, needs_human, unclear
    escalated: bool


SYSTEM_PROMPT_TEMPLATE = """You are a helpful customer support agent for {org_name}.
Use the provided knowledge base articles to answer the customer's question accurately.
If you cannot answer from the knowledge base, or the customer needs human help (billing issues, complaints, account changes), respond with [NEEDS_HUMAN] before your message.
If the question is unclear, respond with [UNCLEAR] before asking a clarifying question.
Be friendly, concise, and helpful.

Knowledge base context:
{knowledge_context}"""


async def process_customer_message(
    org_id: uuid.UUID,
    conv_id: uuid.UUID,
    content: str,
    db: AsyncSession,
) -> PipelineResult:
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = conv_result.scalar_one()

    # Step 1: Check for active bot flow
    flow_response = await execute_flow_step(conv, content, db)
    if flow_response:
        return PipelineResult(response=flow_response, intent="can_handle", escalated=False)

    # Step 2: Get LLM provider
    provider = await get_provider_for_org(org_id, db)
    if not provider:
        return PipelineResult(
            response="I'm sorry, our AI assistant is not configured yet. Let me connect you with a support agent.",
            intent="needs_human",
            escalated=True,
        )

    # Step 3: RAG search
    knowledge_chunks = await search_knowledge(org_id, content, db, provider)
    knowledge_context = "\n\n".join(knowledge_chunks) if knowledge_chunks else "No relevant articles found."

    # Step 4: Build conversation history
    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    messages = list(reversed(msg_result.scalars().all()))
    chat_history = []
    for m in messages:
        role = "user" if m.sender_type.value == "contact" else "assistant"
        chat_history.append({"role": role, "content": m.content})

    # Add current message
    chat_history.append({"role": "user", "content": content})

    # Step 5: Generate response
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        org_name=org.name,
        knowledge_context=knowledge_context,
    )

    llm_response = await provider.generate(chat_history, system_prompt)

    escalated = llm_response.intent == "needs_human"
    if escalated:
        conv.assigned_agent_id = None  # Goes to unassigned queue
        await db.commit()

    return PipelineResult(
        response=llm_response.content,
        intent=llm_response.intent,
        escalated=escalated,
    )
```

- [ ] **Step 3: Wire pipeline into widget WebSocket**

Replace the echo block in `backend/app/ws/widget.py` (the `elif action == "message"` section) — replace the placeholder response with:

```python
                    # AI response
                    from app.ai.pipeline import process_customer_message

                    result = await process_customer_message(org.id, conv.id, content, db)

                    bot_msg = Message(
                        conversation_id=conv.id,
                        sender_type=SenderType.bot,
                        sender_id=conv.id,
                        content=result.response,
                    )
                    db.add(bot_msg)
                    await db.commit()

                    await ws.send_json({
                        "type": "message",
                        "sender_type": "bot",
                        "content": result.response,
                        "intent": result.intent,
                    })

                    if result.escalated:
                        await manager.broadcast_to_agents(str(org.id), {
                            "type": "escalated",
                            "conversation_id": conversation_id,
                            "content": content,
                        })
```

- [ ] **Step 4: Commit and merge phase**

```bash
git add backend/
git commit -m "feat: AI pipeline — bot flow engine, RAG search, LLM generation, escalation"
git checkout main && git merge phase-4/realtime-ai
```

---

## Phase 5: Frontend Foundation

**Branch:** `phase-5/frontend-setup`

**Deliverable:** Next.js 16 project with Tailwind v4, shadcn, auth pages, API client, and dashboard layout shell.

> **Note:** Before writing any frontend code, invoke the `tailwindcss-v4` skill for Tailwind v4 patterns and check `/docs/` for Next.js 16 specifics per AGENTS.md.

---

### Task 13: Next.js Project Setup

**Files:**
- Create: `frontend/` directory via `create-next-app`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: nothing (foundation)
- Produces:
  - Running Next.js 16 dev server on :3000
  - `api.ts` — fetch wrapper: `api.get<T>(path)`, `api.post<T>(path, body)`, `api.put<T>(path, body)`, `api.delete(path)` with JWT from localStorage
  - TypeScript interfaces for all API responses

- [ ] **Step 1: Create Next.js project**

```bash
cd C:\code\customer-support
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Install shadcn/ui**

```bash
cd frontend && npx shadcn@latest init
```

Follow prompts: select defaults. Then install core components:

```bash
npx shadcn@latest add button input label card dialog dropdown-menu avatar badge separator tabs scroll-area sheet tooltip
```

- [ ] **Step 3: Create TypeScript types**

```typescript
// frontend/src/types/index.ts
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
```

- [ ] **Step 4: Create API client**

```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const tokens = await refreshRes.json();
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        headers["Authorization"] = `Bearer ${tokens.access_token}`;
        const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (!retry.ok) throw new Error(`API error: ${retry.status}`);
        return retry.json();
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
```

- [ ] **Step 5: Commit**

```bash
git checkout -b phase-5/frontend-setup
git add frontend/
git commit -m "feat: Next.js 16 project with Tailwind v4, shadcn, types, API client"
```

---

### Task 14: Auth Context + Login/Register Pages

**Files:**
- Create: `frontend/src/lib/auth-context.tsx`
- Create: `frontend/src/components/auth/login-form.tsx`
- Create: `frontend/src/components/auth/register-form.tsx`
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `api.post`, `TokenResponse`, `Agent`
- Produces:
  - `AuthProvider` context with `agent: Agent | null`, `login()`, `register()`, `logout()`
  - `useAuth()` hook
  - `/login` and `/register` pages

- [ ] **Step 1: Create auth context**

```tsx
// frontend/src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import type { Agent, TokenResponse } from "@/types";

interface AuthState {
  agent: Agent | null;
  loading: boolean;
  login: (email: string, password: string, orgSlug: string) => Promise<void>;
  register: (orgName: string, orgSlug: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Decode JWT to get agent info (basic payload extraction)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAgent({ id: payload.sub, org_id: payload.org } as Agent);
      } catch {
        localStorage.removeItem("access_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, orgSlug: string) => {
    const tokens = await api.post<TokenResponse>("/api/auth/login", { email, password, org_slug: orgSlug });
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
    setAgent({ id: payload.sub, org_id: payload.org } as Agent);
  };

  const register = async (orgName: string, orgSlug: string, email: string, password: string, name: string) => {
    const tokens = await api.post<TokenResponse>("/api/auth/register", {
      org_name: orgName, org_slug: orgSlug, email, password, name,
    });
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
    setAgent({ id: payload.sub, org_id: payload.org } as Agent);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAgent(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ agent, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Create login and register form components, pages, and root layout provider**

Create `login-form.tsx`, `register-form.tsx` as client components using shadcn `Button`, `Input`, `Label`, `Card`. Each form calls `useAuth().login()` / `useAuth().register()` and redirects to `/inbox` on success.

Create `(auth)/login/page.tsx` and `(auth)/register/page.tsx` that render the respective forms.

Wrap `app/layout.tsx` children with `<AuthProvider>`.

(Exact component code follows the same pattern — form with state, onSubmit calls auth, error display. The developer should match the component structure to shadcn v4 patterns available at the time of implementation.)

- [ ] **Step 3: Verify login/register pages render**

```bash
cd frontend && npm run dev
# Open http://localhost:3000/login — should see login form
# Open http://localhost:3000/register — should see register form
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: auth context, login/register pages"
```

---

### Task 15: Dashboard Layout Shell

**Files:**
- Create: `frontend/src/components/layout/sidebar.tsx`
- Create: `frontend/src/components/layout/topbar.tsx`
- Create: `frontend/src/app/(dashboard)/layout.tsx`
- Create: `frontend/src/app/(dashboard)/inbox/page.tsx` (placeholder)

**Interfaces:**
- Consumes: `useAuth()`, shadcn components
- Produces:
  - `Sidebar` — vertical nav icons (inbox, contacts, knowledge, flows, settings) matching design
  - `Topbar` — search bar, notification bell, agent status, profile menu
  - `(dashboard)/layout.tsx` — wraps child pages in sidebar + topbar shell, redirects to login if unauthenticated
  - Placeholder inbox page to verify layout renders

- [ ] **Step 1: Create sidebar and topbar components**

Build `sidebar.tsx` as a narrow left sidebar with icon links (using Lucide icons from shadcn). Build `topbar.tsx` as a horizontal bar with search input, bell icon, status dropdown, and avatar menu.

The `(dashboard)/layout.tsx` checks auth state and renders:

```
┌────────┬─────────────────────────────────┐
│Sidebar │ Topbar                          │
│        ├────────────────────────────────  │
│        │ {children}                      │
│        │                                │
└────────┴────────────────────────────────  ┘
```

- [ ] **Step 2: Create placeholder inbox page**

```tsx
// frontend/src/app/(dashboard)/inbox/page.tsx
export default function InboxPage() {
  return <div className="p-6">Inbox — coming in Phase 6</div>;
}
```

- [ ] **Step 3: Verify dashboard shell**

```bash
cd frontend && npm run dev
# Register a new org, login
# Should see sidebar + topbar wrapping the inbox placeholder
```

- [ ] **Step 4: Run /imprint on layout components**

- [ ] **Step 5: Commit and merge phase**

```bash
git add frontend/
git commit -m "feat: dashboard layout shell — sidebar + topbar"
git checkout main && git merge phase-5/frontend-setup
```

---

## Phase 6: Agent Inbox

**Branch:** `phase-6/inbox`

**Deliverable:** Full 3-panel inbox matching Design-Backend — conversation list, chat panel with reply/private notes, contact info panel, real-time WebSocket updates.

---

### Task 16: Conversation List + Chat Panel + Contact Panel

**Files:**
- Create: `frontend/src/lib/ws.ts`
- Create: `frontend/src/components/inbox/conversation-list.tsx`
- Create: `frontend/src/components/inbox/conversation-item.tsx`
- Create: `frontend/src/components/inbox/chat-panel.tsx`
- Create: `frontend/src/components/inbox/message-bubble.tsx`
- Create: `frontend/src/components/inbox/reply-box.tsx`
- Create: `frontend/src/components/inbox/contact-info-panel.tsx`
- Modify: `frontend/src/app/(dashboard)/inbox/page.tsx`
- Create: `frontend/src/app/(dashboard)/inbox/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.*`, `useAuth()`, `Conversation`, `Message`, `Contact`, `Agent` types
- Produces:
  - `useWebSocket(orgId, token)` hook — connects to `/ws/agent/{org_id}`, returns `{ messages, sendMessage, isConnected }`
  - `ConversationList` — fetches and displays conversations, highlights selected, shows unread count
  - `ChatPanel` — displays message thread, Reply/Private Note tabs, reply box with canned response trigger
  - `ContactInfoPanel` — shows contact details, properties, tags, conversation count
  - Full inbox page with 3-panel layout

- [ ] **Step 1: Create WebSocket hook**

```typescript
// frontend/src/lib/ws.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function useAgentWebSocket(orgId: string | undefined, token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    if (!orgId || !token) return;

    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws")}/ws/agent/${orgId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (e) => setLastMessage(JSON.parse(e.data));

    return () => ws.close();
  }, [orgId, token]);

  const send = useCallback((data: Record<string, unknown>) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  return { isConnected, lastMessage, send };
}
```

- [ ] **Step 2: Build inbox components**

Build each component matching the Design-Backend reference:

- **ConversationList**: Fetches `GET /api/conversations`, renders list items with avatar, name, preview, time, tags. Click selects conversation. "Assigned to me" filter at top with count badge.
- **ConversationItem**: Single list entry — avatar circle, contact name, last message preview (truncated), relative time, channel/tag badges.
- **ChatPanel**: Fetches `GET /api/conversations/{id}/messages`. Renders message bubbles (left for contact/bot, right for agent). Reply/Private Note tabs at bottom. Reply box with textarea, attachment toolbar icons, "/" canned response trigger, Send button.
- **MessageBubble**: Styled message with sender name, content, timestamp. Different bg colors for contact vs agent vs bot.
- **ReplyBox**: Textarea, on submit calls WebSocket `send({ action: "message", conversation_id, content })`. Fetches canned responses on "/" keystroke, shows dropdown.
- **ContactInfoPanel**: Fetches `GET /api/contacts/{id}`. Shows name, location, email, phone, social links, collapsible sections for Contact Properties (locale, metadata fields) and Events timeline.

- [ ] **Step 3: Build inbox page**

```tsx
// frontend/src/app/(dashboard)/inbox/[id]/page.tsx
// 3-panel layout: ConversationList | ChatPanel | ContactInfoPanel
// ConversationList gets conversations from API
// ChatPanel shows messages for selected conversation
// ContactInfoPanel shows contact for selected conversation's contact_id
// WebSocket hook listens for new_message, new_conversation, typing events
```

- [ ] **Step 4: Test in browser**

```bash
cd frontend && npm run dev
# With backend running: register, create a test conversation via API, verify inbox renders
```

- [ ] **Step 5: Run /imprint on all inbox components**

- [ ] **Step 6: Commit and merge phase**

```bash
git add frontend/
git commit -m "feat: 3-panel agent inbox — conversation list, chat, contact info"
git checkout main && git merge phase-6/inbox
```

---

## Phase 7: Settings Pages

**Branch:** `phase-7/settings`

**Deliverable:** All settings pages — org settings, widget config with embed code, agent management, canned responses, knowledge base articles, AI config (BYOK).

---

### Task 17: Settings Pages

**Files:**
- Create: `frontend/src/app/(dashboard)/settings/page.tsx` — org settings + widget config + embed code snippet
- Create: `frontend/src/app/(dashboard)/settings/agents/page.tsx` — agent list, invite form
- Create: `frontend/src/app/(dashboard)/settings/canned/page.tsx` — canned response CRUD
- Create: `frontend/src/app/(dashboard)/settings/ai/page.tsx` — API key management (BYOK)
- Create: `frontend/src/app/(dashboard)/knowledge/page.tsx` — knowledge article list + create/edit
- Create: `frontend/src/app/(dashboard)/contacts/page.tsx` — contact list + detail

**Interfaces:**
- Consumes: `api.*`, `useAuth()`, shadcn components, all API types
- Produces: All settings and management pages fully functional

- [ ] **Step 1: Build each settings page**

Each page follows the same pattern: fetch data from API, render in a table/card layout with create/edit/delete actions. Use shadcn Dialog for create/edit modals, Table for lists.

Key page details:

- **Org Settings**: Form with org name, widget config (primary color picker, bot name, greeting text, position select). Shows embed code snippet in a readonly code block.
- **Agent Management**: Table of agents (name, email, role, status). "Invite Agent" button opens dialog with email/name/role form.
- **Canned Responses**: Table with shortcode and content preview. CRUD via dialogs.
- **AI Config**: Card per provider showing if key is configured. Form to add/replace key (provider select + key input). Delete button.
- **Knowledge Base**: Article list (title, updated_at). Click opens editor (title input + content textarea). Create/Save/Delete buttons.
- **Contacts**: Table of contacts with search. Click opens detail panel.

- [ ] **Step 2: Test each page in browser**

- [ ] **Step 3: Run /imprint on settings components**

- [ ] **Step 4: Commit and merge phase**

```bash
git checkout -b phase-7/settings
git add frontend/
git commit -m "feat: all settings pages — org, agents, canned, AI keys, knowledge base, contacts"
git checkout main && git merge phase-7/settings
```

---

## Phase 8: Bot Flow Builder

**Branch:** `phase-8/flow-builder`

**Deliverable:** Visual drag-and-drop flow builder matching Design-Flow, with custom node types and flow CRUD.

---

### Task 18: React Flow Canvas + Custom Nodes + Flow CRUD

**Files:**
- Install: `reactflow` package in frontend
- Create: `frontend/src/components/flows/flow-canvas.tsx`
- Create: `frontend/src/components/flows/flow-toolbar.tsx`
- Create: `frontend/src/components/flows/nodes/trigger-node.tsx`
- Create: `frontend/src/components/flows/nodes/condition-node.tsx`
- Create: `frontend/src/components/flows/nodes/action-node.tsx`
- Create: `frontend/src/components/flows/nodes/bot-response-node.tsx`
- Modify: `frontend/src/app/(dashboard)/flows/page.tsx`
- Create: `frontend/src/app/(dashboard)/flows/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.*`, `BotFlow` type, React Flow library
- Produces:
  - `FlowCanvas` — React Flow canvas with custom node types, drag-from-toolbar to add nodes, connect edges
  - Node types: Trigger (start point), Condition (success/failure branches), Action (escalate, create ticket, send message), Bot Response (message + optional collect field)
  - `FlowToolbar` — draggable node palette
  - Flow list page with create/delete
  - Flow editor page with save + publish/activate

- [ ] **Step 1: Install React Flow**

```bash
cd frontend && npm install @xyflow/react
```

- [ ] **Step 2: Create custom node components**

Each node renders as a styled card matching the Design-Flow reference:
- **TriggerNode**: Green left border, "Create ticket" label, single output handle
- **ConditionNode**: Diamond shape indicator, "Success" (green) and "Failure" (red) output handles
- **ActionNode**: Blue card, action type selector, message field
- **BotResponseNode**: Chat bubble style, editable message text, optional "collect as" field name

- [ ] **Step 3: Create FlowCanvas with toolbar**

FlowCanvas wraps React Flow with custom node types registered. FlowToolbar shows draggable node cards. On drop, adds node to canvas. Save button serializes nodes + edges to JSON and calls `PUT /api/flows/{id}`. Activate button calls `POST /api/flows/{id}/activate`.

- [ ] **Step 4: Create flow pages**

- `flows/page.tsx`: Lists flows from API. Create button. Click flow opens editor.
- `flows/[id]/page.tsx`: Loads flow data, renders FlowCanvas. Top bar with flow name, Save, "Test your bot", Publish buttons (matching Design-Flow).

- [ ] **Step 5: Test in browser**

```bash
cd frontend && npm run dev
# Create a flow, add nodes, connect edges, save, activate
```

- [ ] **Step 6: Run /imprint on flow components**

- [ ] **Step 7: Commit and merge phase**

```bash
git checkout -b phase-8/flow-builder
git add frontend/
git commit -m "feat: visual bot flow builder with React Flow + custom nodes"
git checkout main && git merge phase-8/flow-builder
```

---

## Phase 9: Chat Widget

**Branch:** `phase-9/widget`

**Deliverable:** Standalone embeddable chat widget that works on any website via `<script>` tag.

---

### Task 19: Widget Project Setup + Chat UI + WebSocket

**Files:**
- Create: `widget/package.json`
- Create: `widget/vite.config.ts`
- Create: `widget/tsconfig.json`
- Create: `widget/index.html`
- Create: `widget/src/main.ts`
- Create: `widget/src/widget.ts`
- Create: `widget/src/ws.ts`
- Create: `widget/src/styles.css`

**Interfaces:**
- Consumes: Backend WebSocket at `/ws/widget/{org_slug}`, org widget config via `GET /api/org/widget-config/{org_slug}` (public endpoint — add to backend)
- Produces:
  - Single `widget.js` bundle that embeds via `<script src="widget.js" data-org="slug">`
  - Floating chat bubble, opens chat panel on click
  - WebSocket connection for real-time messaging
  - Session persistence via localStorage

- [ ] **Step 1: Create Vite project**

```json
// widget/package.json
{
  "name": "customer-support-widget",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^6.0.0"
  }
}
```

```typescript
// widget/vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: "CustomerSupportWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    cssCodeSplit: false, // inline CSS into JS
  },
});
```

- [ ] **Step 2: Create main.ts — entry point**

```typescript
// widget/src/main.ts
import { createWidget } from "./widget";

const script = document.currentScript as HTMLScriptElement;
const orgSlug = script?.getAttribute("data-org");
const apiBase = script?.getAttribute("data-api") || "http://localhost:8000";

if (orgSlug) {
  createWidget(orgSlug, apiBase);
}
```

- [ ] **Step 3: Create widget.ts — Shadow DOM + Chat UI**

```typescript
// widget/src/widget.ts
import { connectWebSocket } from "./ws";
import styles from "./styles.css?inline";

export function createWidget(orgSlug: string, apiBase: string) {
  const host = document.createElement("div");
  host.id = "cs-widget-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  const container = document.createElement("div");
  container.className = "cs-widget";
  shadow.appendChild(container);

  // State
  let isOpen = false;
  let conversationId = localStorage.getItem(`cs_conv_${orgSlug}`);
  const messages: Array<{ sender: string; content: string }> = [];

  // Render
  function render() {
    container.innerHTML = `
      <button class="cs-bubble" aria-label="Open chat">${isOpen ? "✕" : "💬"}</button>
      ${isOpen ? `
        <div class="cs-panel">
          <div class="cs-header">
            <span class="cs-status">● Online</span>
            <strong>Support</strong>
            <button class="cs-close">✕</button>
          </div>
          <div class="cs-messages">
            ${messages.map(m => `
              <div class="cs-msg cs-msg--${m.sender}">
                ${m.sender !== "contact" ? '<span class="cs-msg-label">Bot</span>' : '<span class="cs-msg-label">You</span>'}
                <div class="cs-msg-content">${m.sender === "contact" ? escapeHtml(m.content) : m.content}</div>
              </div>
            `).join("")}
          </div>
          <div class="cs-input-area">
            <input class="cs-input" placeholder="Send a message..." />
            <button class="cs-send">➤</button>
          </div>
        </div>
      ` : ""}
    `;

    // Event listeners
    container.querySelector(".cs-bubble")?.addEventListener("click", () => {
      isOpen = !isOpen;
      render();
      if (isOpen && !ws) {
        ws = connectWebSocket(orgSlug, apiBase, conversationId, {
          onMessage(msg) {
            messages.push({ sender: msg.sender_type, content: msg.content });
            render();
            scrollToBottom();
          },
          onHistory(history) {
            messages.length = 0;
            history.forEach((m: any) => messages.push({ sender: m.sender_type, content: m.content }));
            render();
            scrollToBottom();
          },
          onConversationStarted(id) {
            conversationId = id;
            localStorage.setItem(`cs_conv_${orgSlug}`, id);
          },
        });
      }
    });

    container.querySelector(".cs-close")?.addEventListener("click", () => {
      isOpen = false;
      render();
    });

    const input = container.querySelector(".cs-input") as HTMLInputElement;
    const sendBtn = container.querySelector(".cs-send");

    function sendMessage() {
      if (!input?.value.trim()) return;
      const content = input.value.trim();
      messages.push({ sender: "contact", content });
      render();
      scrollToBottom();
      ws?.send(content);
      // Re-select input after render
      (container.querySelector(".cs-input") as HTMLInputElement)?.focus();
    }

    sendBtn?.addEventListener("click", sendMessage);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  function scrollToBottom() {
    const msgContainer = container.querySelector(".cs-messages");
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  let ws: ReturnType<typeof connectWebSocket> | null = null;

  render();
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```

- [ ] **Step 4: Create ws.ts — WebSocket connection**

```typescript
// widget/src/ws.ts
interface WSCallbacks {
  onMessage: (msg: { sender_type: string; content: string }) => void;
  onHistory: (messages: Array<{ sender_type: string; content: string }>) => void;
  onConversationStarted: (id: string) => void;
}

export function connectWebSocket(orgSlug: string, apiBase: string, conversationId: string | null, callbacks: WSCallbacks) {
  const wsUrl = `${apiBase.replace("http", "ws")}/ws/widget/${orgSlug}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: "start",
      conversation_id: conversationId,
    }));
  };

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "conversation_started") {
      callbacks.onConversationStarted(data.conversation_id);
    } else if (data.type === "history") {
      callbacks.onConversationStarted(data.conversation_id);
      callbacks.onHistory(data.messages);
    } else if (data.type === "message") {
      callbacks.onMessage({ sender_type: data.sender_type, content: data.content });
    }
  };

  ws.onclose = () => {
    // ponytail: reconnect after 3s, exponential backoff if needed later
    setTimeout(() => {
      connectWebSocket(orgSlug, apiBase, conversationId, callbacks);
    }, 3000);
  };

  return {
    send(content: string) {
      ws.send(JSON.stringify({ action: "message", content }));
    },
    close() {
      ws.close();
    },
  };
}
```

- [ ] **Step 5: Create styles.css**

```css
/* widget/src/styles.css */
.cs-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
}

.cs-bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #0066ff;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cs-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 370px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cs-header {
  padding: 16px;
  background: #0066ff;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-status {
  color: #4ade80;
  font-size: 10px;
}

.cs-close {
  margin-left: auto;
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.cs-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-msg-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
  display: block;
}

.cs-msg-content {
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 85%;
  line-height: 1.4;
  word-wrap: break-word;
}

.cs-msg--contact .cs-msg-content {
  background: #0066ff;
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.cs-msg--contact { text-align: right; }

.cs-msg--bot .cs-msg-content,
.cs-msg--agent .cs-msg-content {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.cs-input-area {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
}

.cs-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
}

.cs-input:focus {
  border-color: #0066ff;
}

.cs-send {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #0066ff;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
```

- [ ] **Step 6: Create dev test page**

```html
<!-- widget/index.html -->
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>Test Page</h1>
  <p>The widget should appear in the bottom-right corner.</p>
  <script type="module" src="/src/main.ts" data-org="test-corp" data-api="http://localhost:8000"></script>
</body>
</html>
```

- [ ] **Step 7: Add public widget config endpoint to backend**

Add to `backend/app/api/org.py`:

```python
@router.get("/widget-config/{org_slug}")
async def get_widget_config(org_slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.slug == org_slug))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org.widget_config
```

- [ ] **Step 8: Test widget end-to-end**

```bash
cd widget && npm install && npm run dev
# Open http://localhost:5173 — widget bubble should appear
# Click it, send a message, verify it hits the backend WebSocket
```

- [ ] **Step 9: Build production bundle**

```bash
cd widget && npm run build
# Output: widget/dist/widget.js — single file, ready to embed
```

- [ ] **Step 10: Commit and merge phase**

```bash
git checkout -b phase-9/widget
git add widget/ backend/app/api/org.py
git commit -m "feat: embeddable chat widget — Shadow DOM, WebSocket, session persistence"
git checkout main && git merge phase-9/widget
```

---

## Self-Review Checklist

### Spec Coverage
- [x] Multi-tenant with row-level `org_id` isolation — Task 2 models, all API queries filter by org
- [x] Org registration (open) + agent invite (admin-only) — Tasks 5, 6
- [x] Email verification — Task 6
- [x] JWT auth (access + refresh) — Task 5
- [x] All data model entities — Task 2
- [x] CRUD for contacts, conversations, messages, notes — Task 8
- [x] Canned responses, knowledge articles, bot flows — Task 9
- [x] Org settings + widget config — Task 9
- [x] BYOK API key management — Task 9
- [x] WebSocket widget endpoint — Task 10
- [x] WebSocket agent endpoint — Task 10
- [x] Connection manager with routing — Task 10
- [x] Provider-agnostic LLM (Claude + OpenAI) — Task 11
- [x] RAG with pgvector — Task 11
- [x] Bot flow engine — Task 12
- [x] AI pipeline (flow → RAG → LLM → intent → route) — Task 12
- [x] Next.js 16 + Tailwind v4 + shadcn — Task 13
- [x] Auth pages (login/register) — Task 14
- [x] Dashboard layout (sidebar + topbar) — Task 15
- [x] 3-panel inbox matching Design-Backend — Task 16
- [x] All settings pages — Task 17
- [x] Visual flow builder matching Design-Flow — Task 18
- [x] Embeddable widget with Shadow DOM — Task 19
- [x] Docker Compose (Postgres + pgvector, Redis, Mailhog) — Task 1

### Placeholder Scan
- No TBD/TODO found
- Bot flow engine has real graph-walking logic, not a placeholder
- Claude embed fallback is marked with ponytail comment and upgrade path

### Type Consistency
- `LLMResponse.content` / `.intent` consistent across provider.py and pipeline.py
- `PipelineResult.response` / `.intent` / `.escalated` consistent in pipeline.py and widget.py WS handler
- `ConnectionManager` method names consistent between manager.py, widget.py, and agent.py
- API path patterns consistent between backend routers and frontend `api.ts` calls
- All model field names match between SQLAlchemy models, Pydantic schemas, and TypeScript types
