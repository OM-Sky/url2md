# url2md

**URL to clean Markdown API** — convert any web page to readable Markdown via a single HTTP request.

🌐 **Live:** https://url2md-production-47d0.up.railway.app  
📦 **Repo:** https://github.com/OM-Sky/url2md

---

## Quick Start

```bash
# Free tier (10 requests/day)
curl "https://url2md-production-47d0.up.railway.app/scrape?url=https://example.com"

# Pro tier (unlimited)
curl "https://url2md-production-47d0.up.railway.app/scrape?url=https://example.com&key=YOUR_API_KEY"
```

## Response

```json
{
  "markdown": "# Example Domain\n\nThis domain is for use in illustrative examples...",
  "title": "Example Domain",
  "url": "https://example.com"
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page |
| `GET` | `/health` | Health check `{ok: true}` |
| `GET` | `/scrape?url=<url>` | Free tier — 10 req/day per IP |
| `GET` | `/scrape?url=<url>&key=<key>` | Pro tier — unlimited |
| `POST` | `/webhooks/lemon` | Lemon Squeezy order webhook |

## Rate Limits

Free tier is rate-limited to **10 requests per day** per IP address, resetting at midnight UTC.

Response headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1704067200
```

## Pricing

| Plan | Price | Requests |
|------|-------|----------|
| Free | $0/month | 10/day |
| Pro | $4/month | Unlimited |

Get Pro access: checkout link on the [landing page](https://url2md-production-47d0.up.railway.app).

## Stack

- **Runtime:** Node.js 20 / TypeScript
- **Framework:** Fastify 4
- **Scraping:** node-fetch + cheerio + turndown
- **Auth:** better-sqlite3 (local SQLite)
- **Email:** Resend
- **Payments:** Lemon Squeezy
- **Deploy:** Railway (nixpacks)

## Development

```bash
npm install
npm run dev      # ts-node dev server
npm run build    # compile TypeScript
npm start        # run compiled
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment |
| `RESEND_API_KEY` | Resend API key for emails |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signature secret |
| `DB_PATH` | SQLite database path (default: ./keys.db) |

---

MIT License · Built with ❤️
