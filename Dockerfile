FROM node:14-alpine AS build

WORKDIR /app

RUN apk add --no-cache --virtual .build-deps git python make automake autoconf g++ libpng-dev libtool nasm file

ADD package.json yarn.lock ./

RUN yarn install

RUN apk del .build-deps

ADD . .

RUN yarn build:ssr

# Expose the port
EXPOSE 80

# set app serving to permissive / assigned
ENV NUXT_HOST=0.0.0.0
# set app port
ENV NUXT_PORT=80

# start the client
CMD [ "yarn", "start:ssr" ]
