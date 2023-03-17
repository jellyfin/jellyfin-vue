## This dockerfile builds the client entirely in a Docker context

FROM node:18-alpine AS build

# Set build arguments
ARG DEFAULT_SERVERS
ARG HISTORY_ROUTER_MODE=1
ARG IS_STABLE=0

# Set environment variables
ENV DEFAULT_SERVERS=$DEFAULT_SERVERS
ENV HISTORY_ROUTER_MODE=$HISTORY_ROUTER_MODE
ENV IS_STABLE=$IS_STABLE

# Prepare environment. git is needed for fetching the latest commit
RUN apk add --no-cache git
WORKDIR /app
COPY . .

# Install dependencies
RUN npm ci --no-audit

# Build client
RUN if [[ $IS_STABLE == "0" ]] ; then export COMMIT_HASH=$(git rev-parse HEAD) ; fi && npm run build

# Deploy built distribution to nginx
FROM nginx:alpine-slim

COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY .docker/*.sh /
RUN apk add --no-cache jq && \
 rm -rf /docker-entrypoint.d /.dockerenv /usr/sbin/nginx-debug && \
 chmod +x /*.sh

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
LABEL org.opencontainers.image.description="Commit: ${COMMIT_HASH}"
