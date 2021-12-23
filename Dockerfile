## This dockerfile builds the client entirely in a Docker context
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"

FROM node:16-alpine AS build

# Build dependencies required to build some node modules on ARM platforms
RUN apk add --no-cache python3 make g++

# Set workdir
WORKDIR /app

# Copy files to workdir
COPY . .

# Install dependencies
RUN npm ci --no-audit

# Build static site
RUN NUXT_ENV_COMMIT=$(git rev-parse HEAD) npm run build

# Deploy built distribution to nginx
FROM nginx:alpine
COPY --from=build /app/src/dist/ /usr/share/nginx/html/

EXPOSE 80
