import { io } from "socket.io-client";

// Connect to the same origin since HTTP and WebSocket share port 3000
const socketUrl = window.location.origin;

export const socket = io(socketUrl, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("[SOCKET.IO CLIENT] Connected with session ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[SOCKET.IO CLIENT] Disconnected:", reason);
});
