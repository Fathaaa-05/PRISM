// Vercel serverless function: GET/PUT /api/sync?id=… (shared projects)
import { handleSync } from "../lib/sync.mjs";

export default async function handler(req, res) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  try {
    const out = await handleSync(req.method, req.query.id, req.query.rev, body, req.headers["x-access-code"] || "");
    res.status(out.status).json(out.json);
  } catch (e) {
    res.status(500).json({ error: { type: "storage", message: String(e.message || e) } });
  }
}
