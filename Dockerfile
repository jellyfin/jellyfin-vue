## This dockerfile builds the client entirely in a Docker context

FROM node:14-alpine AS build

WORKDIR /app

# Install build dependencies for node modules
RUN apk add --no-cache --virtual .build-deps git python make automake autoconf g++ libpng-dev libtool nasm file

COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build SSR app for production in standalone mode

RUN yarn build --production --standalone

# Build final image
FROM node:14-alpine

WORKDIR /app

COPY .docker/package.json .docker/nuxt.config.js ./

# Copy client files from the build image
COPY --from=build /app/.nuxt ./.nuxt
COPY --from=build /app/static ./static

# Install runtime dependencies
RUN yarn install --production --no-lockfile

EXPOSE 80

CMD [ "yarn", "start" ]
