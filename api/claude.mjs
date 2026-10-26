// Vercel serverless function: POST /api/claude
import { handleAI } from "../lib/ai.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: { message: "Use POST" } }); return; }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const out = await handleAI(body, req.headers["x-access-code"] || "");
  res.status(out.status).json(out.json);
}
