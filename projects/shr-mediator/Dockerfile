# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY ./ .  

# Installer stage
FROM node:18-alpine AS installer

WORKDIR /app

COPY --from=builder /app/package*.json .
# COPY --from=builder /app/patches ./patches

RUN npm update -g npm

RUN npm config set registry https://registry.npmjs.com/

RUN npm i --verbose --maxsockets 6

# Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=installer /app/ .
COPY ./ . 

EXPOSE 80 3000 3001 3002

CMD [ "npm", "run", "start" ]
