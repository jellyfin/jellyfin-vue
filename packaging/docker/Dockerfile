## This dockerfile builds the client entirely in a Docker context

FROM node:24-slim AS build
WORKDIR /app

# Bring in the whole workspace source in one go.
# Exclude node_modules/dist in case they exist in the build context (e.g. a
# local checkout with packages already installed/built).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY --exclude=**/node_modules --exclude=**/dist packages /app/packages
WORKDIR /app/packages/frontend

# Set build arguments
ARG IS_STABLE=0
ARG COMMIT_HASH
# Set environment variables
ENV IS_STABLE=$IS_STABLE
ENV COMMIT_HASH=$COMMIT_HASH

# Install and build in the same layer. pnpm links each workspace package's
# own nested node_modules with directory renames; when that install ran in
# an earlier, already-committed layer, any later step touching those directories
# forces overlayfs to copy them up from the read-only lower layer first, which
# fails with "Invalid cross-device link" (EXDEV) in this environment. Combining
# install + build into one RUN avoids that layer boundary entirely. This does mean
# the install step is no longer cached independently of source changes, but
# the pnpm store cache mount below still persists across builds (including
# --no-cache ones, since mount caches are independent from layer caching),
# so re-installs still skip re-downloading packages - only the relink/build
# work is repeated.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store corepack pnpm ci && corepack pnpm build

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
