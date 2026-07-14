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
    // ponytail: simple reconnect, add exponential backoff if needed
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
