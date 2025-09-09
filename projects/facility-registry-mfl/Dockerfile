# Builder stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

COPY ./ .  

# Installer stage
FROM node:18-alpine AS installer

WORKDIR /app

COPY --from=builder /app/package*.json .
# COPY --from=builder /app/patches ./patches

RUN npm config set registry https://registry.npmjs.com/

RUN npm update -g npm

RUN npm i --verbose --maxsockets 6

# Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=installer /app/ .
# Copy source files and config from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

EXPOSE 3005

CMD [ "npm", "run", "start" ]
