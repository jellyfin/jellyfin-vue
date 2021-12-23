## This dockerfile builds the client entirely in a Docker context

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
RUN npm run build

# Deploy built distribution to nginx
FROM nginx:alpine
COPY --from=build /app/src/dist/ /usr/share/nginx/html/

EXPOSE 80
