# Framed's Node version, for a VPS (ops/compose.yaml). Build from the repo root:
#   docker build -t framed:local .
# Read-only filesystem, no capabilities, non-root (ops/compose.yaml).
#
# About 570 MB. Some of node_modules is tooling (vue, vitest, typescript)
# that npm keeps because the lockfile records it as Better Auth's optional
# peers; dropping it would mean installing without the lockfile, which would
# lose exact, repeatable versions, so it stays.

# 1. The site (Vite) and the server bundles (esbuild), then only runtime dependencies.
FROM node:24-slim AS build
# better-sqlite3 compiles itself if no prebuilt binary matches the platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:node && npm prune --omit=dev

# 2. What runs: the built files, the runtime dependencies and the migrations.
FROM node:24-slim
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin framed \
    && mkdir /data && chown framed /data
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/dist dist
COPY --from=build /app/dist-node dist-node
COPY --from=build /app/migrations migrations
ENV NODE_ENV=production \
    PORT=8790 \
    DATABASE_PATH=/data/framed.sqlite
USER framed
EXPOSE 8790
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "fetch('http://127.0.0.1:8790/api/sign-up').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist-node/main.mjs"]
