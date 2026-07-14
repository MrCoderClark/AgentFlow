import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BotFlow, Conversation


async def get_active_flow(org_id: uuid.UUID, db: AsyncSession) -> BotFlow | None:
    result = await db.execute(
        select(BotFlow).where(BotFlow.org_id == org_id, BotFlow.is_active == True)  # noqa: E712
    )
    return result.scalar_one_or_none()


async def execute_flow_step(
    conv: Conversation,
    message: str,
    db: AsyncSession,
) -> str | None:
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
        trigger_nodes = [n for n in nodes if n.get("type") == "trigger"]
        if not trigger_nodes:
            return None
        current_node_id = trigger_nodes[0]["id"]

    current_node = next((n for n in nodes if n["id"] == current_node_id), None)
    if not current_node:
        return None

    node_type = current_node.get("type", "")
    node_data = current_node.get("data", {})

    response = None

    if node_type == "trigger":
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
            conv.assigned_agent_id = None
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
