## This dockerfile builds the client entirely in a Docker context

# slim image can't be used since we need git to fetch the commit hash
FROM node:20-slim AS build

# Set build arguments
ARG IS_STABLE=0
ARG COMMIT_HASH
# Set environment variables
ENV IS_STABLE=$IS_STABLE
ENV COMMIT_HASH=$COMMIT_HASH

COPY package.json package-lock.json .npmrc /app/
COPY frontend /app/frontend
WORKDIR /app/frontend

# Build client
RUN npm ci --no-audit && npm run build

# Deploy built distribution to nginx
FROM nginx:stable-alpine-slim

COPY packaging/docker/contents/nginx.conf /etc/nginx/conf.d/default.conf
COPY packaging/docker/contents/*.sh /
COPY LICENSE /usr/share/licenses/jellyfin-vue.LICENSE

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/
RUN chmod +x /*.sh && /postunpack.sh && rm /postunpack.sh
USER nginx

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
