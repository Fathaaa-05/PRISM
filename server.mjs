// Plain Node server for any host (Render, Railway, a VPS, or your own PC).
//   npm install && node server.mjs          (settings come from .env or the environment)
//   node server.mjs --open                  (also opens PRISM in your browser; used by the Start PRISM launchers)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Load .env (KEY=value lines) without overriding variables that are already set.
const envFile = path.join(dir, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const val = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
// Ignore the placeholder values from .env.example.
if (/^sk-ant-\.\.\.$|^$/.test(process.env.ANTHROPIC_API_KEY || "")) delete process.env.ANTHROPIC_API_KEY;
if (process.env.ACCESS_CODE === "choose-a-secret-code" || process.env.ACCESS_CODE === "") delete process.env.ACCESS_CODE;

const { handleAI, aiStatus } = await import("./lib/ai.mjs");
const { handleSync } = await import("./lib/sync.mjs");
const STATIC = { "/manifest.webmanifest": "application/manifest+json", "/sw.js": "text/javascript", "/icon-192.png": "image/png", "/icon-512.png": "image/png" };
const OPEN = process.argv.includes("--open");
let port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/claude") {
      let raw = "";
      for await (const chunk of req) { raw += chunk; if (raw.length > 500_000) break; }
      let body = null; try { body = JSON.parse(raw); } catch {}
      const out = await handleAI(body, req.headers["x-access-code"] || "");
      res.writeHead(out.status, { "content-type": "application/json" }).end(JSON.stringify(out.json));
      return;
    }
    if (req.url.startsWith("/api/sync")) {
      const u = new URL(req.url, "http://x");
      let body = null;
      if (req.method === "PUT") { let raw = ""; for await (const chunk of req) { raw += chunk; if (raw.length > 4_000_000) break; } try { body = JSON.parse(raw); } catch {} }
      const out = await handleSync(req.method, u.searchParams.get("id"), u.searchParams.get("rev"), body, req.headers["x-access-code"] || "");
      res.writeHead(out.status, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(out.json));
      return;
    }
    if (req.method === "GET" && STATIC[req.url]) {
      res.writeHead(200, { "content-type": STATIC[req.url] }).end(await readFile(path.join(dir, req.url.slice(1))));
      return;
    }
    if (req.method === "GET" && req.url === "/api/status") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(await aiStatus()));
      return;
    }
    if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?") || req.url.startsWith("/index.html"))) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(await readFile(path.join(dir, "index.html")));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" }).end("Server error");
  }
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && port < 3010) { port++; server.listen(port); return; }
  console.error("Could not start PRISM:", e.message); process.exit(1);
});
server.on("listening", async () => {
  const url = `http://localhost:${port}`;
  const s = await aiStatus();
  console.log("");
  console.log("  PRISM is running at " + url);
  console.log("  AI: " + (s.ai === "claude" ? "Claude (" + s.model + ")" : s.ai === "ollama" ? "free local AI through Ollama (" + s.model + ")" : "PRISM built-in engine (no key or install needed)"));
  if (s.sync === "file") console.log("  Shared projects are saved in the 'data' folder here.");
  console.log("  Keep this window open during the demo. Close it (or press Ctrl+C) to stop.");
  console.log("");
  if (OPEN) {
    const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
server.listen(port);
