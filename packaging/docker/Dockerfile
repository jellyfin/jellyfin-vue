## This dockerfile builds the client entirely in a Docker context

# slim image can't be used since we need git to fetch the commit hash
FROM node:20 AS build

# Set build arguments
ARG IS_STABLE=0
# Set environment variables
ENV IS_STABLE=$IS_STABLE

COPY package.json package-lock.json .npmrc /app/
COPY .git /app/.git
COPY frontend /app/frontend
WORKDIR /app/frontend

# Install dependencies
RUN npm ci --no-audit --ignore-scripts

# Build client
RUN COMMIT_HASH=$(git rev-parse HEAD) npm run build

# Deploy built distribution to nginx
FROM nginx:stable-alpine-slim

COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/
COPY packaging/docker/contents/nginx.conf /etc/nginx/conf.d/default.conf
COPY packaging/docker/contents/*.sh /
COPY LICENSE /usr/share/licenses/jellyfin-vue.LICENSE
RUN chmod +x /*.sh && /postunpack.sh && rm /postunpack.sh
USER nginx

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
LABEL org.opencontainers.image.description="Commit: ${COMMIT_HASH}"
