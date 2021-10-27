## This dockerfile builds the client entirely in a Docker context

FROM node:16-alpine AS build

WORKDIR /app

# Install build dependencies for node modules
RUN apk add --no-cache --virtual .build-deps git python make automake autoconf g++ libpng-dev libtool nasm file

COPY . .

# Install dependencies
RUN npm ci --no-audit

# Build SSR app for production in standalone mode
RUN npm run build:standalone

# Build final image
FROM node:16-alpine

WORKDIR /app

COPY .docker/package.json .docker/package-lock.json .docker/nuxt.config.js ./

# Copy client files from the build image
COPY --from=build /app/src/.nuxt ./.nuxt
COPY --from=build /app/src/static ./static

# Install runtime dependencies
RUN npm ci --production --no-audit
RUN rm -rf package-lock.json

EXPOSE 80

CMD [ "npm", "start" ]
