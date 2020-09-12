FROM node:13-alpine AS build

# Install build dependencies for node modules
RUN apk add git python make g++

# Set workdir
WORKDIR /app

# Add package.json and yarn.lock
ADD package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy resources
ADD . .

# Build static site
RUN yarn generate

# Deploy built distribution to nginx
FROM nginx:alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
