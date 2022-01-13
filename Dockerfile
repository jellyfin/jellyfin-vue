## This dockerfile builds the client entirely in a Docker context

FROM node:16-alpine AS build

# Set build arguments
ARG HISTORY_ROUTER_MODE=1
ARG IS_STABLE=0

# Set environment variables
ENV HISTORY_ROUTER_MODE=$HISTORY_ROUTER_MODE
ENV NUXT_ENV_COMMIT=""

# Build dependencies required to build some node modules on ARM platforms. git is needed for fetching the latest commit
RUN apk add --no-cache git

# Set workdir
WORKDIR /app

# Copy files to workdir
COPY . .

# Install dependencies
RUN npm ci --no-audit

# Set commit hash
RUN if [[ $IS_STABLE == "0" ]] ; then NUXT_ENV_COMMIT=$(git rev-parse HEAD) ; fi

# Build client
RUN npm run build

# Deploy built distribution to nginx
FROM nginx:alpine

COPY --from=build /app/src/dist/ /usr/share/nginx/html/
COPY --from=build /app/.docker/nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
LABEL org.opencontainers.image.description="Commit: ${NUXT_ENV_COMMIT} History router rode: ${HISTORY_ROUTER_MODE}"
