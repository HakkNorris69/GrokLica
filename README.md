# GrokLica

Super Grok replica chat app (UI + optional WebSocket backend).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the UI works immediately in **demo mode**.

Optional live server:

```bash
npm run server
```

Then refresh the app. Status should show **WebSocket online**.

## Stack

- Next.js frontend (`app/`, `components/Chat.tsx`)
- `ws` server on port 8080 (`server/ws.mjs`)

This is a replica shell, not the official xAI Grok API.
