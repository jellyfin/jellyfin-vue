FROM node:12-alpine AS build

WORKDIR /app

RUN apk add --no-cache --virtual .build-deps git python make automake autoconf g++ libpng-dev libtool nasm file

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# Build SSR app for production in standalone mode

RUN yarn build --production --standalone

# Build final image
FROM node:12-alpine

WORKDIR /app

COPY .docker/package.json .docker/nuxt.config.js ./

# Copy client files from the build image
COPY --from=build /app/.nuxt ./.nuxt
COPY --from=build /app/static ./static

# Install runtime dependencies
RUN yarn install --production

EXPOSE 80

CMD [ "yarn", "start" ]
