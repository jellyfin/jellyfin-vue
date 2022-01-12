## This dockerfile builds the client entirely in a Docker context

FROM node:16-alpine AS build
# Set environment variables
ARG ROUTER_MODE_HISTORY=false

ARG IS_STABLE=0

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
RUN if [[ $ROUTER_MODE_HISTORY == 'true' ]] ; then \ 
echo "building with router.mode = history" ; \
ROUTER_MODE_HISTORY="true" | npm run build ; \
else \
echo "building with router.mode = hash" ; \
npm run build ; \
fi



# Deploy built distribution to nginx
FROM nginx:alpine

ARG ROUTER_MODE_HISTORY=false

COPY --from=build /app/src/dist/ /usr/share/nginx/html/

COPY --from=build /app/nginx.conf /etc/nginx/custom.conf 

# If specified, set's custom nginx.conf to support spa (for 'history' routing mode)
RUN  if [[ $ROUTER_MODE_HISTORY == 'true' ]] ; then \
  echo "configuring nginx for router.mode = history" ; \
  mv /etc/nginx/custom.conf /etc/nginx/nginx.conf  ; \
else \
  echo "standard nginx configuration for router.mode = hash" ; \
fi



EXPOSE 80

# Set labels
LABEL maintainer="Jellyfin Packaging Team - packaging@jellyfin.org"
LABEL org.opencontainers.image.source="https://github.com/jellyfin/jellyfin-vue"
LABEL org.opencontainers.image.description "Commit: ${NUXT_ENV_COMMIT}"
