# AI Tutor service (`apps/tutor`)

Flask service for Hassona / AI tutor: community Q&A search, hints, insights, and learning-path routing. The Nibras API proxies `/v1/community/chatbot/*` to this service when `CHATBOT_V1_URL` is set.

Previously maintained as the separate **ChatBot.V1** repository; it now lives in the monorepo.

## Local development

1. Set `OPENAI_API_KEY` or `NIBRAS_AI_API_KEY` in the repo root `.env` (see `.env.example`).
2. Set `CHATBOT_V1_URL=http://127.0.0.1:5000` in the root `.env` so the API can reach the tutor.
3. Start Postgres and the main stack (`npm run dev`), then in another terminal:

```bash
npm run tutor:dev
```

Or with Docker:

```bash
docker compose up -d tutor
```

## API surface (called by `apps/api`)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ask` | Ask the tutor (hints + answer) |
| `POST /api/insights` | Learning insights |
| `POST /api/routing` | Learning path routing |

The Next.js app uses `/tutor` and talks to the API, not to this service directly.
