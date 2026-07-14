(function(){"use strict";function m(c,a,d,r){const g=`${a.replace("http","ws")}/ws/widget/${c}`,t=new WebSocket(g);return t.onopen=()=>{t.send(JSON.stringify({action:"start",conversation_id:d}))},t.onmessage=o=>{const s=JSON.parse(o.data);s.type==="conversation_started"?r.onConversationStarted(s.conversation_id):s.type==="history"?(r.onConversationStarted(s.conversation_id),r.onHistory(s.messages)):s.type==="message"&&r.onMessage({sender_type:s.sender_type,content:s.content})},t.onclose=()=>{setTimeout(()=>{m(c,a,d,r)},3e3)},{send(o){t.send(JSON.stringify({action:"message",content:o}))},close(){t.close()}}}const S=".cs-widget{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px}.cs-bubble{width:56px;height:56px;border-radius:50%;border:none;background:#06f;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 12px #00000026;display:flex;align-items:center;justify-content:center}.cs-panel{position:absolute;bottom:70px;right:0;width:370px;height:500px;background:#fff;border-radius:12px;box-shadow:0 8px 32px #00000026;display:flex;flex-direction:column;overflow:hidden}.cs-header{padding:16px;background:#06f;color:#fff;display:flex;align-items:center;gap:8px}.cs-status{color:#4ade80;font-size:10px}.cs-close{margin-left:auto;background:none;border:none;color:#fff;font-size:18px;cursor:pointer}.cs-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}.cs-msg-label{font-size:11px;color:#6b7280;margin-bottom:2px;display:block}.cs-msg-content{padding:10px 14px;border-radius:12px;max-width:85%;line-height:1.4;word-wrap:break-word}.cs-msg--contact .cs-msg-content{background:#06f;color:#fff;margin-left:auto;border-bottom-right-radius:4px}.cs-msg--contact{text-align:right}.cs-msg--bot .cs-msg-content,.cs-msg--agent .cs-msg-content{background:#f3f4f6;color:#1f2937;border-bottom-left-radius:4px}.cs-input-area{padding:12px;border-top:1px solid #e5e7eb;display:flex;gap:8px}.cs-input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;outline:none}.cs-input:focus{border-color:#06f}.cs-send{width:36px;height:36px;border-radius:50%;border:none;background:#06f;color:#fff;font-size:16px;cursor:pointer}";function k(c,a){const d=document.createElement("div");d.id="cs-widget-host",document.body.appendChild(d);const r=d.attachShadow({mode:"closed"}),g=document.createElement("style");g.textContent=S,r.appendChild(g);const t=document.createElement("div");t.className="cs-widget",r.appendChild(t);let o=!1,s=localStorage.getItem(`cs_conv_${c}`);const p=[];function l(){var v,w;t.innerHTML=`
      <button class="cs-bubble" aria-label="Open chat">${o?"✕":"💬"}</button>
      ${o?`
        <div class="cs-panel">
          <div class="cs-header">
            <span class="cs-status">● Online</span>
            <strong>Support</strong>
            <button class="cs-close">✕</button>
          </div>
          <div class="cs-messages">
            ${p.map(e=>`
              <div class="cs-msg cs-msg--${e.sender}">
                ${e.sender!=="contact"?'<span class="cs-msg-label">Bot</span>':'<span class="cs-msg-label">You</span>'}
                <div class="cs-msg-content">${e.sender==="contact"?_(e.content):e.content}</div>
              </div>
            `).join("")}
          </div>
          <div class="cs-input-area">
            <input class="cs-input" placeholder="Send a message..." />
            <button class="cs-send">➤</button>
          </div>
        </div>
      `:""}
    `,(v=t.querySelector(".cs-bubble"))==null||v.addEventListener("click",()=>{o=!o,l(),o&&!u&&(u=m(c,a,s,{onMessage(e){p.push({sender:e.sender_type,content:e.content}),l(),b()},onHistory(e){p.length=0,e.forEach(f=>p.push({sender:f.sender_type,content:f.content})),l(),b()},onConversationStarted(e){s=e,localStorage.setItem(`cs_conv_${c}`,e)}}))}),(w=t.querySelector(".cs-close"))==null||w.addEventListener("click",()=>{o=!1,l()});const n=t.querySelector(".cs-input"),x=t.querySelector(".cs-send");function y(){var f;if(!(n!=null&&n.value.trim()))return;const e=n.value.trim();p.push({sender:"contact",content:e}),l(),b(),u==null||u.send(e),(f=t.querySelector(".cs-input"))==null||f.focus()}x==null||x.addEventListener("click",y),n==null||n.addEventListener("keydown",e=>{e.key==="Enter"&&y()})}function b(){const n=t.querySelector(".cs-messages");n&&(n.scrollTop=n.scrollHeight)}let u=null;l()}function _(c){const a=document.createElement("div");return a.textContent=c,a.innerHTML}const i=document.currentScript,h=i==null?void 0:i.getAttribute("data-org"),E=(i==null?void 0:i.getAttribute("data-api"))||"http://localhost:8000";h&&k(h,E)})();
