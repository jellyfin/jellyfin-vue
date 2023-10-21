## This dockerfile builds the client entirely in a Docker context

FROM node:18 AS build

# Set build arguments
ARG DEFAULT_SERVERS
ARG HISTORY_ROUTER_MODE=1
ARG IS_STABLE=0

# Set environment variables
ENV DEFAULT_SERVERS=$DEFAULT_SERVERS
ENV HISTORY_ROUTER_MODE=$HISTORY_ROUTER_MODE
ENV IS_STABLE=$IS_STABLE

COPY package.json package-lock.json .npmrc /app/
COPY .git /app/.git
COPY frontend /app/frontend
WORKDIR /app/frontend

# Install dependencies
RUN npm ci --no-audit --ignore-scripts

# Build client
RUN if [ $"IS_STABLE" = "0" ] ; then export COMMIT_HASH=$(git rev-parse HEAD) ; fi && npm run build

# Deploy built distribution to nginx
FROM nginx:stable-alpine-slim

COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/
COPY packaging/docker/contents/nginx.conf /etc/nginx/conf.d/default.conf
COPY packaging/docker/contents/*.sh /
RUN apk add --no-cache jq && \
 rm -rf /docker-entrypoint.d /.dockerenv /usr/sbin/nginx-debug && \
 chmod +x /*.sh

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
LABEL org.opencontainers.image.description="Commit: ${COMMIT_HASH}"
