FROM node:lts-alpine AS build

WORKDIR /app

# Install build dependencies for node modules
RUN apk add --no-cache --virtual .build-deps git python make automake autoconf g++ libpng-dev libtool nasm file

COPY . .

RUN yarn install --frozen-lockfile

# Build SSR app for production in standalone mode

RUN yarn build --production --standalone

# Build final image
FROM node:lts-alpine

WORKDIR /app

COPY .docker/package.json .docker/nuxt.config.js ./

# Copy client files from the build image
COPY --from=build /app/.nuxt ./.nuxt
COPY --from=build /app/static ./static

# Install runtime dependencies
RUN yarn install --production --forzen-lockfile

EXPOSE 80

CMD [ "yarn", "start" ]
