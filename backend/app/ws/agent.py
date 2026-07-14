import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select

from app.api.deps import ALGORITHM
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Conversation, Message, Organization, SenderType
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/agent/{org_id}")
async def agent_ws(ws: WebSocket, org_id: str):
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

                    org_result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
                    org = org_result.scalar_one()
                    await manager.send_to_conversation(org.slug, conv_id, {
                        "type": "message",
                        "sender_type": "agent",
                        "content": content,
                    })

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
