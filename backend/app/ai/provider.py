import hashlib
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

        intent = "can_handle"
        if "[NEEDS_HUMAN]" in content:
            intent = "needs_human"
            content = content.replace("[NEEDS_HUMAN]", "").strip()
        elif "[UNCLEAR]" in content:
            intent = "unclear"
            content = content.replace("[UNCLEAR]", "").strip()

        return LLMResponse(content=content, intent=intent)

    async def embed(self, text: str) -> list[float]:
        # ponytail: hash-based dev embedding, swap for Voyage/OpenAI when ready
        h = hashlib.sha256(text.encode()).hexdigest()
        return [int(h[i:i + 2], 16) / 255.0 for i in range(0, min(len(h), 3072), 2)]


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
