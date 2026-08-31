"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "bot";
type Msg = { id: string; role: Role; text: string };
type Thread = { id: string; title: string; messages: Msg[] };

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function demoReply(prompt: string) {
  const q = prompt.toLowerCase();
  if (q.includes("who") && q.includes("you"))
    return "I'm GrokLica — a Super Grok replica UI. Demo mode replies locally. Start `npm run server` for WebSocket.";
  if (q.includes("hello") || q.includes("hi"))
    return "Hey. What do you want to build?";
  return `Got it: "${prompt}"\n\nThis is a local replica reply. Connect the WebSocket server for live backend messages.`;
}

export default function Chat() {
  const [threads, setThreads] = useState<Thread[]>([
    { id: uid(), title: "New chat", messages: [] },
  ]);
  const [activeId, setActiveId] = useState(threads[0].id);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"demo" | "online" | "offline">("demo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingBotId = useRef<string | null>(null);

  const active = threads.find((t) => t.id === activeId) || threads[0];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [active?.messages.length]);

  useEffect(() => {
    let closed = false;
    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          if (!closed) setStatus("online");
        };
        ws.onmessage = (e) => {
          const text = String(e.data);
          const botId = pendingBotId.current;
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== activeId) return t;
              if (botId && t.messages.some((m) => m.id === botId)) {
                return {
                  t,
                  ...t,
                  messages: t.messages.map((m) => (m.id === botId ? { ...m, text } : m)),
                } as Thread;
              }
              return { ...t, messages: [...t.messages, { id: uid(), role: "bot", text }] };
            })
          );
        };
        ws.onclose = () => {
          if (!closed) {
            setStatus("demo");
            setTimeout(connect, 2500);
          }
        };
        ws.onerror = () => ws.close();
      } catch {
        setStatus("demo");
      }
    }
    connect();
    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, [activeId]);

  function newChat() {
    const t = { id: uid(), title: "New chat", messages: [] as Msg[] };
    setThreads((p) => [t, ...p]);
    setActiveId(t.id);
  }

  function send() {
    const text = input.trim();
    if (!text || !active) return;
    const userMsg: Msg = { id: uid(), role: "user", text };
    const botMsg: Msg = { id: uid(), role: "bot", text: status === "online" ? "…" : demoReply(text) };
    pendingBotId.current = botMsg.id;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              title: t.messages.length === 0 ? text.slice(0, 28) : t.title,
              messages: [...t.messages, userMsg, botMsg],
            }
          : t
      )
    );
    setInput("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {sidebarOpen && (
        <aside
          style={{
            width: 240,
            borderRight: "1px solid #222",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            background: "#111",
          }}
        >
          <button
            onClick={newChat}
            style={{
              background: "#fff",
              color: "#000",
              border: 0,
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            New chat
          </button>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: t.id === activeId ? "#1c1c1c" : "transparent",
                  color: "#ddd",
                  border: 0,
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  marginBottom: 4,
                }}
              >
                {t.title}
              </button>
            ))}
          </div>
        </aside>
      )}
      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            padding: 14,
            borderBottom: "1px solid #222",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{ background: "transparent", color: "#aaa", border: 0, cursor: "pointer" }}
            >
              ☰
            </button>
            <strong>GrokLica</strong>
          </div>
          <span style={{ fontSize: 12, color: status === "online" ? "#4caf50" : "#888" }}>
            {status === "online" ? "WebSocket online" : "Demo mode"}
          </span>
        </header>
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {active.messages.length === 0 && (
            <p style={{ color: "#777", margin: "auto", textAlign: "center" }}>
              Super Grok replica. Ask anything — demo replies work without a server.
            </p>
          )}
          {active.messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 12,
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#1a1a1a" : "#141414",
                border: "1px solid #2a2a2a",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          style={{ padding: 16, borderTop: "1px solid #222", display: "flex", gap: 8 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message GrokLica..."
            style={{
              flex: 1,
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 24,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#fff",
              color: "#000",
              border: 0,
              borderRadius: 24,
              padding: "12px 18px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
