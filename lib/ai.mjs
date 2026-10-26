// Picks the AI behind PRISM: Claude (with ANTHROPIC_API_KEY), else free local Ollama, else none.
// With none, the browser uses PRISM's built-in engine, so the app always works.
import { handleClaude } from "./claude.mjs";
import { ollamaModel, handleOllama } from "./ollama.mjs";
import { syncMode } from "./sync.mjs";

export async function aiStatus() {
  const sync = syncMode();
  if (process.env.ANTHROPIC_API_KEY) return { ai: "claude", model: process.env.CLAUDE_MODEL || "claude-opus-5-5", accessCode: !!process.env.ACCESS_CODE, sync };
  const m = await ollamaModel();
  if (m) return { ai: "ollama", model: m, accessCode: !!process.env.ACCESS_CODE, sync };
  return { ai: "builtin", sync };
}

export async function handleAI(body, accessCode) {
  if (process.env.ANTHROPIC_API_KEY) return handleClaude(body, accessCode);
  const m = await ollamaModel();
  if (!m) return { status: 503, json: { error: { type: "no_ai", message: "No AI service configured; using the built-in engine." } } };
  if (process.env.ACCESS_CODE && accessCode !== process.env.ACCESS_CODE) return { status: 401, json: { error: { type: "access_code", message: "Wrong or missing access code." } } };
  if (!body || !Array.isArray(body.messages) || !body.messages.length) return { status: 400, json: { error: { type: "invalid_request", message: "messages required" } } };
  return handleOllama(body, m);
}
