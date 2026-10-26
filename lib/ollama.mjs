// Free local AI through Ollama (https://ollama.com), used when there is no Claude API key.
// Converts PRISM's Claude-style requests to Ollama's chat API and back.
const BASE = () => (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
let cachedModel = null, checkedAt = 0;

// Returns the model name to use, or null when Ollama is not running or has no model.
export async function ollamaModel() {
  if (process.env.OLLAMA_DISABLED === "1") return null;
  if (Date.now() - checkedAt < 15000) return cachedModel;
  checkedAt = Date.now();
  try {
    const r = await fetch(BASE() + "/api/tags", { signal: AbortSignal.timeout(1500) });
    const names = ((await r.json()).models || []).map((m) => m.name);
    const want = process.env.OLLAMA_MODEL;
    cachedModel = want ? (names.some((n) => n === want || n.startsWith(want + ":")) ? want : null)
      : names.find((n) => /qwen/i.test(n)) || names.find((n) => /llama3|mistral|gemma/i.test(n)) || names[0] || null;
  } catch { cachedModel = null; }
  return cachedModel;
}

function toOllama(messages) {
  const out = [], names = {};
  for (const m of messages) {
    if (typeof m.content === "string") { out.push({ role: m.role, content: m.content }); continue; }
    const blocks = Array.isArray(m.content) ? m.content : [];
    if (m.role === "assistant") {
      const text = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const calls = blocks.filter((b) => b.type === "tool_use");
      calls.forEach((b) => { names[b.id] = b.name; });
      out.push({ role: "assistant", content: text, ...(calls.length ? { tool_calls: calls.map((b) => ({ function: { name: b.name, arguments: b.input || {} } })) } : {}) });
    } else {
      for (const b of blocks) {
        if (b.type === "tool_result") out.push({ role: "tool", tool_name: names[b.tool_use_id], content: typeof b.content === "string" ? b.content : JSON.stringify(b.content) });
        else if (b.type === "text") out.push({ role: "user", content: b.text });
      }
    }
  }
  return out;
}

export async function handleOllama(body, model) {
  const { messages, tools } = body;
  const last = messages[messages.length - 1];
  const wantsJson = !tools?.length && typeof last.content === "string" && /Reply with only a JSON object/.test(last.content);
  const payload = {
    model, stream: false, messages: toOllama(messages),
    options: { num_ctx: Number(process.env.OLLAMA_CONTEXT) || 16384, temperature: 0.4 }, keep_alive: "30m",
    ...(wantsJson ? { format: "json" } : {}),
    ...(tools?.length ? { tools: tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })) } : {}),
  };
  try {
    // Thinking models (qwen3, deepseek) are much faster on a laptop with thinking off. Older Ollama or models may refuse the flag, so retry without it.
    const post = (p) => fetch(BASE() + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p), signal: AbortSignal.timeout(280000) });
    let r = await post({ ...payload, think: process.env.OLLAMA_THINK === "1" });
    if (!r.ok && r.status === 400) r = await post(payload);
    if (!r.ok) return { status: 502, json: { error: { type: "upstream", message: "Ollama: " + (await r.text()).slice(0, 300) } } };
    const res = await r.json(), msg = res.message || {};
    const content = [];
    if (msg.content) content.push({ type: "text", text: msg.content });
    (msg.tool_calls || []).forEach((c, i) => {
      let input = c.function?.arguments || {};
      if (typeof input === "string") { try { input = JSON.parse(input); } catch { input = {}; } }
      content.push({ type: "tool_use", id: "call_" + Date.now().toString(36) + "_" + i, name: c.function?.name, input });
    });
    return { status: 200, json: { content, stop_reason: (msg.tool_calls || []).length ? "tool_use" : res.done_reason === "length" ? "max_tokens" : "end_turn", engine: "ollama:" + model } };
  } catch (e) {
    cachedModel = null; checkedAt = 0;
    return { status: 503, json: { error: { type: "no_ai", message: "Ollama did not answer: " + String(e?.message || e) } } };
  }
}
