import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import path from 'path';
import { scrapeUrl } from './scraper.js';
import { validateKey, initDb } from './auth.js';
import { checkRateLimit } from './ratelimit.js';
import { handleLemonWebhook } from './webhooks.js';

const server = Fastify({ logger: true });

// Serve static files from /public
server.register(staticPlugin, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',
});

// Health check
server.get('/health', async () => ({ ok: true }));

// Scrape route
server.get<{
  Querystring: { url?: string; key?: string };
}>('/scrape', async (request, reply) => {
  const { url, key } = request.query;

  if (!url) {
    reply.code(400).send({ error: 'Missing ?url= parameter' });
    return;
  }

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    reply.code(400).send({ error: 'Invalid URL' });
    return;
  }

  // Paid tier: validate key
  if (key) {
    const valid = await validateKey(key);
    if (!valid) {
      reply.code(401).send({ error: 'Invalid or inactive API key' });
      return;
    }
  } else {
    // Free tier: apply rate limit
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip;

    const { allowed, remaining, resetAt } = checkRateLimit(ip);
    reply.header('X-RateLimit-Limit', '10');
    reply.header('X-RateLimit-Remaining', String(remaining));
    reply.header('X-RateLimit-Reset', String(Math.floor(resetAt / 1000)));

    if (!allowed) {
      reply.code(429).send({
        error: 'Rate limit exceeded. Free tier: 10 requests/day. Get Pro for unlimited access.',
        resetAt: new Date(resetAt).toISOString(),
      });
      return;
    }
  }

  try {
    const result = await scrapeUrl(parsedUrl.href);
    reply.send(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    server.log.error({ err }, 'Scrape failed');
    reply.code(502).send({ error: `Failed to scrape: ${message}` });
  }
});

// Lemon Squeezy webhook
server.post('/webhooks/lemon', handleLemonWebhook);

// Start
const port = Number(process.env.PORT) || 3000;

async function start() {
  await initDb();
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`url2md listening on port ${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
