FROM node:13-alpine AS build

# Install git for cloning dependencies
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

# Deploy to nginx
FROM nginx:latest

# Copy built static site to deployment
COPY --from=build /app/dist/ /usr/share/nginx/html/
