import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/** Middleware dev untuk /api/copilot (sama dengan api/copilot.ts di Vercel) supaya key tidak bocor ke browser. */
function copilotDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'copilot-dev-api',
    configureServer(server) {
      // Dev saja: sajikan board desain asli (design-ref/project) di /__ref untuk pembandingan visual satu-origin.
      server.middlewares.use('/__ref', async (req, res) => {
        const { readFile } = await import('node:fs/promises');
        const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/\.\./g, '');
        const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
        try {
          const data = await readFile(path.join(process.cwd(), 'design-ref/project', rel));
          res.setHeader('Content-Type', types[path.extname(rel)] ?? 'application/octet-stream');
          res.end(data);
        } catch {
          res.statusCode = 404;
          res.end('nf');
        }
      });
      server.middlewares.use('/api/copilot', async (req, res) => {
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        const key = env.ANTHROPIC_API_KEY;
        if (req.method === 'GET') return send(200, { enabled: !!key });
        if (req.method !== 'POST') return send(405, { error: 'method' });
        if (!key) return send(503, { error: 'disabled' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        try {
          const { story, now } = JSON.parse(raw) as { story?: string; now?: string };
          if (!story?.trim() || story.length > 6000) return send(400, { error: 'story' });
          const { extractWithClaude } = await server.ssrLoadModule('/server/copilotCore.ts');
          const extraction = await extractWithClaude(story.trim(), now ?? new Date().toISOString(), key);
          return send(200, { extraction });
        } catch {
          return send(502, { error: 'ai' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), copilotDevApi(env)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    test: { environment: 'jsdom', globals: true, setupFiles: ['src/test-setup.ts'] },
  };
});
