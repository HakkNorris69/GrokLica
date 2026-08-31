import { WebSocketServer } from "ws";

const port = Number(process.env.WS_PORT || 8080);
const wss = new WebSocketServer({ port });

function reply(text) {
  const q = String(text).toLowerCase();
  if (q.includes("who") && q.includes("you")) {
    return "GrokLica WebSocket backend. Not the official Grok API — local replica server.";
  }
  return `Server received: ${text}`;
}

wss.on("connection", (socket) => {
  socket.send("Connected to GrokLica WebSocket.");
  socket.on("message", (raw) => {
    const text = raw.toString();
    socket.send(reply(text));
  });
});

console.log(`GrokLica WS listening on ws://localhost:${port}`);
