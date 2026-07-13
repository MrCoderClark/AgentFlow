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
    intent: str
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

    flow_response = await execute_flow_step(conv, content, db)
    if flow_response:
        return PipelineResult(response=flow_response, intent="can_handle", escalated=False)

    provider = await get_provider_for_org(org_id, db)
    if not provider:
        return PipelineResult(
            response="I'm sorry, our AI assistant is not configured yet. Let me connect you with a support agent.",
            intent="needs_human",
            escalated=True,
        )

    knowledge_chunks = await search_knowledge(org_id, content, db, provider)
    knowledge_context = "\n\n".join(knowledge_chunks) if knowledge_chunks else "No relevant articles found."

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

    chat_history.append({"role": "user", "content": content})

    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        org_name=org.name,
        knowledge_context=knowledge_context,
    )

    llm_response = await provider.generate(chat_history, system_prompt)

    escalated = llm_response.intent == "needs_human"
    if escalated:
        conv.assigned_agent_id = None
        await db.commit()

    return PipelineResult(
        response=llm_response.content,
        intent=llm_response.intent,
        escalated=escalated,
    )
