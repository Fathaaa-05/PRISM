// Vercel serverless function: GET /api/status (which AI PRISM is using)
import { aiStatus } from "../lib/ai.mjs";
export default async function handler(req, res) { res.status(200).json(await aiStatus()); }
