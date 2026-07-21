# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 는 빌드 시점에 인라인됩니다. docker compose build-args 로 전달하세요.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CONTACT_EMAIL=
ARG NEXT_PUBLIC_SITE_OPERATOR_NAME=
ARG NEXT_PUBLIC_CONTACT_PHONE=
ARG NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=
ARG NAVER_MAP_CLIENT_ID=
ARG NEXT_PUBLIC_USE_NAVER_MAP=

ARG APP_COMMIT=dev
ENV APP_COMMIT=$APP_COMMIT

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_SITE_OPERATOR_NAME=$NEXT_PUBLIC_SITE_OPERATOR_NAME
ENV NEXT_PUBLIC_CONTACT_PHONE=$NEXT_PUBLIC_CONTACT_PHONE
ENV NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=$NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
ENV NAVER_MAP_CLIENT_ID=$NAVER_MAP_CLIENT_ID
ENV NEXT_PUBLIC_USE_NAVER_MAP=$NEXT_PUBLIC_USE_NAVER_MAP
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ARG APP_COMMIT=dev
ENV APP_COMMIT=$APP_COMMIT

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/data /app/public/uploads \
  && chown -R nextjs:nodejs /app/data /app/public/uploads

USER root
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
