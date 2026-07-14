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

  let isOpen = false;
  let conversationId = localStorage.getItem(`cs_conv_${orgSlug}`);
  const messages: Array<{ sender: string; content: string }> = [];

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
            history.forEach((m) => messages.push({ sender: m.sender_type, content: m.content }));
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
