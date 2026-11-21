# Framed's Node version, for a VPS (ops/compose.yaml). Build from the repo root:
#   docker build -t framed:local .
# Read-only filesystem, no capabilities, non-root (ops/compose.yaml).
#
# About 570 MB. Some of node_modules is tooling (vue, vitest, typescript)
# that npm keeps because the lockfile records it as Better Auth's optional
# peers; dropping it would mean installing without the lockfile, which would
# lose exact, repeatable versions, so it stays.
#
# The base image is pinned by digest, so a rebuild gets exactly the image that
# was tested, not whatever the tag points to that day. Both stages use it. To
# update it (for a Node security release):
#   1. find the new digest for the tag, on Docker Hub or with
#      `docker buildx imagetools inspect node:24-slim` (the top "Digest:");
#   2. replace the version and digest in NODE_IMAGE below;
#   3. rebuild, run the checks, and redeploy.

ARG NODE_IMAGE=node:24.22.3-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54

# 1. The site (Vite) and the server bundles (esbuild), then only runtime dependencies.
FROM ${NODE_IMAGE} AS build
# better-sqlite3 compiles itself if no prebuilt binary matches the platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:node && npm prune --omit=dev

# 2. What runs: the built files, the runtime dependencies and the migrations.
FROM ${NODE_IMAGE}
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
    DATABASE_PATH=/data/framed.sqlite \
    FILES_PATH=/data/files
USER framed
EXPOSE 8790
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "fetch('http://127.0.0.1:8790/api/sign-up').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist-node/main.mjs"]
