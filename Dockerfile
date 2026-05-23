# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/cli/package.json ./apps/cli/
COPY apps/worker/package.json ./apps/worker/
COPY apps/proxy/package.json ./apps/proxy/
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/github/package.json ./packages/github/
COPY packages/grading/package.json ./packages/grading/
RUN npm ci --ignore-scripts

FROM deps AS build
ARG NEXT_PUBLIC_NIBRAS_API_BASE_URL
ARG NEXT_PUBLIC_NIBRAS_WEB_BASE_URL
ENV NEXT_PUBLIC_NIBRAS_API_BASE_URL=$NEXT_PUBLIC_NIBRAS_API_BASE_URL
ENV NEXT_PUBLIC_NIBRAS_WEB_BASE_URL=$NEXT_PUBLIC_NIBRAS_WEB_BASE_URL
COPY . .
RUN npm run build && npm run web:build

# ── API service ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/prisma ./prisma
EXPOSE 4848
CMD ["node", "apps/api/dist/server.js"]

# ── Worker service ────────────────────────────────────────────────────────────
FROM node:20-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/prisma ./prisma
CMD ["node", "apps/worker/dist/worker.js"]

# ── Web service ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
