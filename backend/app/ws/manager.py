from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.widget_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)
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
