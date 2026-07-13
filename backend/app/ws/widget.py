import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.ai.pipeline import process_customer_message
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

                    await manager.broadcast_to_agents(str(org.id), {
                        "type": "new_conversation",
                        "conversation_id": conversation_id,
                        "contact_name": contact.name,
                    })

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

                    await manager.broadcast_to_agents(str(org.id), {
                        "type": "new_message",
                        "conversation_id": conversation_id,
                        "sender_type": "contact",
                        "content": content,
                    })

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
