// Shared projects: one copy of a project that every team member's browser reads and updates.
// Storage: Upstash Redis / Vercel KV when its REST variables are set (works on Vercel),
// otherwise JSON files in ./data (works on your own computer or any normal server).
import fs from "node:fs/promises";
import path from "node:path";

const DIR = process.env.PRISM_DATA_DIR || path.join(process.cwd(), "data");
const MAX = 3_000_000;

function kv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}
// "cloud", "file" or null (null on Vercel without storage, because its disk is not kept)
export function syncMode() {
  if (kv()) return "cloud";
  if (process.env.VERCEL) return null;
  return "file";
}
async function getDoc(id) {
  const k = kv();
  if (k) {
    const r = await fetch(`${k.url}/get/prism:${id}`, { headers: { authorization: `Bearer ${k.token}` } });
    if (!r.ok) throw new Error("storage " + r.status);
    const j = await r.json();
    return j.result ? JSON.parse(j.result) : null;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, id + ".json"), "utf8")); } catch { return null; }
}
async function putDoc(id, doc) {
  const k = kv(), body = JSON.stringify(doc);
  if (k) {
    const r = await fetch(`${k.url}/set/prism:${id}`, { method: "POST", headers: { authorization: `Bearer ${k.token}` }, body });
    if (!r.ok) throw new Error("storage " + r.status);
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  const tmp = path.join(DIR, id + ".tmp");
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, path.join(DIR, id + ".json"));
}
const err = (status, type, message) => ({ status, json: { error: { type, message } } });

// method GET: ?id=…&rev=N  → the project, or {same:true} when nothing changed since rev N
// method PUT: {baseRev, data, by} → {rev}, or 409 with the newer copy when someone saved first
export async function handleSync(method, id, rev, body, accessCode) {
  if (!syncMode()) return err(503, "no_sync", "Shared projects need storage. See the README: 'Share projects with your team'.");
  if (process.env.ACCESS_CODE && accessCode !== process.env.ACCESS_CODE) return err(401, "access_code", "Wrong or missing access code.");
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id || "")) return err(400, "bad_id", "Invalid project id.");
  const cur = await getDoc(id);
  if (method === "GET") {
    if (!cur) return err(404, "not_found", "This shared project does not exist.");
    if (rev != null && Number(rev) === cur.rev) return { status: 200, json: { rev: cur.rev, same: true } };
    return { status: 200, json: cur };
  }
  if (method === "PUT") {
    if (!body || typeof body.data !== "object") return err(400, "bad_body", "data required");
    const have = cur ? cur.rev : 0;
    if (Number(body.baseRev || 0) !== have) return { status: 409, json: cur || { rev: 0, data: {} } };
    const doc = { rev: have + 1, data: body.data, by: String(body.by || "").slice(0, 60), updatedAt: new Date().toISOString() };
    if (JSON.stringify(doc).length > MAX) return err(413, "too_big", "Project is too large to share.");
    await putDoc(id, doc);
    return { status: 200, json: { rev: doc.rev } };
  }
  return err(405, "method", "Use GET or PUT");
}
