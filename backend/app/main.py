from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.bot_flows import router as bot_flows_router
from app.api.canned import router as canned_router
from app.api.contacts import router as contacts_router
from app.api.conversations import router as conversations_router
from app.api.knowledge import router as knowledge_router
from app.api.messages import router as messages_router
from app.api.org import router as org_router
from app.api.private_notes import router as private_notes_router
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


app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(private_notes_router)
app.include_router(canned_router)
app.include_router(knowledge_router)
app.include_router(bot_flows_router)
app.include_router(org_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
