## This dockerfile builds the client entirely in a Docker context

FROM node:24-slim AS build

# Copy only the workspace manifests first so dependency installation is cached
# independently of source code changes: this layer only busts when a
# package.json or the lockfile actually change, not on every commit.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY --parents packages/*/package.json /app/
WORKDIR /app/packages/frontend

# Install dependencies. The cache mount persists pnpm's content-addressable
# store across builds (including --no-cache builds, since mount caches are
# independent from layer caching), so re-installs skip re-downloading packages.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store corepack pnpm ci

# Set build arguments
ARG IS_STABLE=0
ARG COMMIT_HASH
# Set environment variables
ENV IS_STABLE=$IS_STABLE
ENV COMMIT_HASH=$COMMIT_HASH

# Now bring in the actual source. COMMIT_HASH changes on almost every build,
# but it's declared above the install step so it never invalidates it.
# Exclude node_modules/dist in case they exist in the build context (e.g. a
# local checkout with packages already installed/built).
COPY --exclude=**/node_modules --exclude=**/dist packages /app/packages

# Build client
RUN --mount=type=cache,target=/root/.local/share/pnpm/store corepack pnpm build

# Deploy built distribution to nginx
FROM ghcr.io/nginxinc/nginx-unprivileged:stable-alpine-slim

ENV ASSETS=/usr/share/nginx/html
ENV NGINX_DEFAULT_SITE_CONFIG=/etc/nginx/conf.d/default.conf

COPY packaging/docker/contents/nginx.conf "$NGINX_DEFAULT_SITE_CONFIG"
COPY packaging/docker/contents/*.sh /
COPY LICENSE /usr/share/licenses/jellyfin-vue

USER root
RUN rm -rf "$ASSETS"/*
COPY --from=build /app/packages/frontend/dist/ "$ASSETS"
RUN chmod +x /*.sh && /postunpack.sh && rm /postunpack.sh
USER nginx
WORKDIR "$ASSETS"

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
