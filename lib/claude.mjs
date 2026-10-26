// Shared handler: forwards PRISM's AI requests to the Claude API.
// The API key stays on the server (ANTHROPIC_API_KEY); the browser never sees it.
import Anthropic from "@anthropic-ai/sdk";

let client = null; // created on first use; reads ANTHROPIC_API_KEY
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CLAUDE_EFFORT || "medium";
const MAX_BODY_CHARS = 400_000;

function bad(status, message, type = "invalid_request") {
  return { status, json: { error: { type, message } } };
}

export async function handleClaude(body, accessCode) {
  if (!process.env.ANTHROPIC_API_KEY) return bad(500, "The server has no ANTHROPIC_API_KEY set.", "config");
  if (process.env.ACCESS_CODE && accessCode !== process.env.ACCESS_CODE) return bad(401, "Wrong or missing access code.", "access_code");
  if (!body || typeof body !== "object") return bad(400, "Expected a JSON body.");
  if (JSON.stringify(body).length > MAX_BODY_CHARS) return bad(413, "Request too large.");

  const { messages, tools } = body;
  if (!Array.isArray(messages) || !messages.length || messages[0].role !== "user") return bad(400, "messages must start with a user turn.");
  for (const m of messages) if (!["user", "assistant"].includes(m.role) || m.content == null) return bad(400, "Each message needs role user/assistant and content.");
  const toolDefs = Array.isArray(tools)
    ? tools.slice(0, 20).map((t) => ({ name: String(t.name), description: String(t.description || ""), input_schema: t.input_schema || { type: "object", properties: {} } }))
    : [];

  try {
    client = client || new Anthropic();
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: EFFORT },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if a safety classifier declines, the API retries on Anthropic's recommended fallback model
      messages,
      ...(toolDefs.length ? { tools: toolDefs } : {}),
    });
    return { status: 200, json: { content: msg.content, stop_reason: msg.stop_reason } };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return bad(429, "Claude API rate limit reached. Try again in a minute.", "rate_limited");
    if (err instanceof Anthropic.AuthenticationError) return bad(500, "The Claude API key on the server is not valid.", "config");
    if (err instanceof Anthropic.BadRequestError) return bad(400, err.message, "invalid_request");
    if (err instanceof Anthropic.APIError) return bad(502, err.message, "upstream");
    return bad(500, String((err && err.message) || err), "server");
  }
}
