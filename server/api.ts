import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';
import { buildSystemPrompt } from '../src/config/systemPrompt';

let client: Anthropic | null = null;
let systemPrompt: string = '';

function init() {
  if (client) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[API] ANTHROPIC_API_KEY not set');
    return;
  }

  client = new Anthropic({ apiKey });

  // Load product data for system prompt
  const dataPath = resolve(process.cwd(), 'products.json');
  const productData = readFileSync(dataPath, 'utf-8');
  systemPrompt = buildSystemPrompt(productData);

  console.log('[API] Claude API initialized');
}

export function apiPlugin(): Plugin {
  return {
    name: 'claude-api',
    configureServer(server) {
      // Load .env and .env.local manually for Vite server
      // .env.local overrides .env (loaded second)
      for (const envFile of ['.env', '.env.local']) {
        const dotenvPath = resolve(process.cwd(), envFile);
        try {
          const envContent = readFileSync(dotenvPath, 'utf-8');
          for (const line of envContent.split('\n')) {
            const [key, ...valParts] = line.split('=');
            if (key && valParts.length) {
              process.env[key.trim()] = valParts.join('=').trim();
            }
          }
        } catch {}
      }

      init();

      server.middlewares.use('/api/chat', async (req, res) => {
        // CORS
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Read body
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        try {
          const { messages } = JSON.parse(body);

          if (!client) {
            init();
            if (!client) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'API key not configured' }));
              return;
            }
          }

          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          });

          const text = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('');

          res.statusCode = 200;
          res.end(JSON.stringify({ reply: text }));
        } catch (err: any) {
          console.error('[API] Error:', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
