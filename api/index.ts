import express from "express";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { mapEnvVariables } from "./_utils/env.js";
import { appCheckVerification } from "./_middleware/appCheck.js";
import { otpRouter } from "./_routes/otp.js";
import { opayRouter } from "./_routes/opay.js";
import { instagramRouter, startInstagramCrawlerCron, getFirestoreInstance } from "./_routes/instagram.js";
import { menuRouter } from "./_routes/menu.js";
import { mysqlRouter } from "./_routes/mysql.js";
import { deliveryRouter } from "./_routes/delivery.js";
import { chatbotRouter } from "./_routes/chatbot.js";

// Ensure standard and VITE_ prefixed environment variables are correctly mapped
mapEnvVariables();

const app = express(); 
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configure Socket.IO behavior
io.on("connection", (socket) => {
  console.log(`[SOCKET.IO SERVER] Client connected: ${socket.id}`);

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    console.log(`[SOCKET.IO SERVER] Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on("order-message", (data) => {
    const { orderId } = data;
    if (orderId) {
      // Broadcast to everyone in that order's room
      io.to(`order_${orderId}`).emit("order-message", data);
    }
  });

  socket.on("support-message", (data) => {
    const { sessionId } = data;
    if (sessionId) {
      // Broadcast to everyone in that support session's room
      io.to(`support_${sessionId}`).emit("support-message", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET.IO SERVER] Client disconnected: ${socket.id}`);
  });
});

app.use(express.json());

// Path normalizer to handle Vercel serverless routing variations gracefully (where Vercel might strip /api prefix from the routed request)
app.use((req: any, res: any, next: any) => {
  const originalUrl = req.url || "";
  const originalPath = req.path || "";
  
  // If Vercel stripped /api prefix or routed to index.ts, try to restore from Vercel headers
  const vercelPath = req.headers["x-vercel-forwarded-path"] || req.headers["x-forwarded-uri"] || req.headers["x-original-url"];
  if (vercelPath && typeof vercelPath === "string" && vercelPath.startsWith("/api") && req.url !== vercelPath) {
    console.log(`[Vercel Router Compatibility] Overriding req.url from Vercel headers: "${req.url}" -> "${vercelPath}"`);
    req.url = vercelPath;
  }

  const url = req.url || "";
  const path = req.path || "";
  if (!url.startsWith("/api") && (
    path.startsWith("/otp/") ||
    path.startsWith("/opay/") ||
    path.startsWith("/seed-menu") ||
    path.startsWith("/instagram/") ||
    path.startsWith("/mysql/") ||
    path.startsWith("/delivery/") ||
    path.startsWith("/smtp/") ||
    path.startsWith("/test/")
  )) {
    console.log(`[Vercel Router Compatibility] Normalizing request path to start with /api (from "${req.url}" to "/api${req.url}")`);
    try {
      req.url = `/api${req.url}`;
    } catch (e: any) {
      console.warn("[Vercel Router Compatibility] Failed to assign req.url directly. Attempting Object.defineProperty:", e.message);
      try {
        Object.defineProperty(req, "url", {
          value: `/api${req.url}`,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (defineErr: any) {
        console.error("[Vercel Router Compatibility] Ultimate failure defining req.url:", defineErr.message);
      }
    }
  }
  next();
});

// Enable Cross-Origin Resource Sharing (CORS) for all routes,
// allowing our live domain (upside-restaurant-cafe.com) to seamlessly communicate with the server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, ClientAuthKey, Timestamp, BodyFormat, bodyformat, clientauthkey, X-Firebase-AppCheck, x-firebase-appcheck");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// App Check verification middleware - gracefully handles verification to support all sandboxes and custom setups
app.use("/api", appCheckVerification);
app.use(appCheckVerification);

// Mount modular sub-routers (with both /api prefix and raw prefix to guarantee match under all serverless configurations)
app.use("/api/otp", otpRouter);
app.use("/api/opay", opayRouter);
app.use("/api/instagram", instagramRouter);
app.use("/api/seed-menu", menuRouter);
app.use("/api/mysql", mysqlRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/chatbot", chatbotRouter);

app.use("/otp", otpRouter);
app.use("/opay", opayRouter);
app.use("/instagram", instagramRouter);
app.use("/seed-menu", menuRouter);
app.use("/mysql", mysqlRouter);
app.use("/delivery", deliveryRouter);
app.use("/chatbot", chatbotRouter);

// Serve frontend assets
async function serveApp() {
  if (process.env.VERCEL) {
    console.log("[SERVER] Loaded inside Vercel serverless context. Skipping local listen port registration.");
    return;
  }

  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (!isProduction) {
    console.log("[SERVER] Starting App in development mode (using Vite middleware)...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Dynamic wildcard fallback in development for SPA client-side routes (e.g. /menu)
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      try {
        const htmlPath = path.join(process.cwd(), "index.html");
        if (fs.existsSync(htmlPath)) {
          let html = fs.readFileSync(htmlPath, "utf-8");
          // Run Vite HTML transformations to insert client-side modules correctly
          html = await vite.transformIndexHtml(req.url, html);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } else {
          res.status(404).send("index.html not found");
        }
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    console.log("[SERVER] Starting App in production mode (serving pre-built dist)...");
    app.use(express.static(distPath));
    
    // Catch-all route for SPA client-side routes in production
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.warn(`[SERVER WARNING] dist/index.html not found at ${indexPath}. Falling back dynamically.`);
        const fallbackPath = path.join(process.cwd(), "index.html");
        if (fs.existsSync(fallbackPath)) {
          res.sendFile(fallbackPath);
        } else {
          res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Upside Restaurant & Café</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fcfbf9; color: #1c1917; }
                h1 { font-size: 24px; margin-bottom: 8px; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <h1>Upside Restaurant & Café</h1>
              <p>Establishing secure connection... Please refresh in a moment.</p>
              <script>
                setTimeout(() => { window.location.reload(); }, 2000);
              </script>
            </body>
            </html>
          `);
        }
      }
    });
  }

  if (typeof PORT === "string" && (PORT.startsWith("/") || PORT.startsWith("\\"))) {
    // Unix Socket pipe used by cPanel Passenger Phusion
    httpServer.listen(PORT, () => {
      console.log(`Express server running on Passenger unix socket with Socket.IO: ${PORT}`);
    });
  } else {
    const bindPort = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;
    httpServer.listen(bindPort, "0.0.0.0", () => {
      console.log(`Express server executing on http://0.0.0.0:${bindPort} with Socket.IO`);
    });
  }

  // Start the background Instagram crawl check
  try {
    getFirestoreInstance().then(db => {
      startInstagramCrawlerCron(db);
    }).catch(err => {
      console.error("[SERVER] Failed to auto-start Instagram background crawler Firestore connection:", err.message);
    });
  } catch (err: any) {
    console.error("[SERVER] Failed to auto-start Instagram background crawler:", err.message);
  }
}

serveApp();

// Global error handler middleware registered after all routes to capture express exceptions gracefully as JSON responses
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[GLOBAL SERVER ERROR HANDLER] Uncaught server exception:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: err?.message || "An internal gateway error occurred on the identity server.",
    details: process.env.NODE_ENV !== "production" ? err?.stack : undefined
  });
});

export default app;