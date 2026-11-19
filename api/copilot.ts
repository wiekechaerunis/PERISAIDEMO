// Fungsi serverless Vercel: POST /api/copilot { story, now } → { extraction }; GET → { enabled }.
// ANTHROPIC_API_KEY hanya ada di sini (tidak pernah dikirim ke browser).
import { copilotEnabled, extractWithClaude } from '../server/copilotCore';

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status: (n: number) => Res;
  json: (b: unknown) => void;
}

export default async function handler(req: Req, res: Res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ enabled: copilotEnabled(process.env) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!key) return res.status(503).json({ error: 'disabled' });
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { story?: string; now?: string } | undefined;
  const story = body?.story?.trim();
  if (!story || story.length > 6000) return res.status(400).json({ error: 'story' });
  try {
    const extraction = await extractWithClaude(story, body?.now ?? new Date().toISOString(), key);
    return res.status(200).json({ extraction });
  } catch {
    return res.status(502).json({ error: 'ai' });
  }
}
