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

# Set environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_1
ENV ORACLE_HOME=/opt/oracle/instantclient_21_1

# Install Oracle Instant Client
RUN apk update && apk add --no-cache \
    libaio \
    wget \
    unzip \
    libnsl \
    libc6-compat \
    && mkdir -p /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && unzip instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && rm -f instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && ln -s /usr/lib/libnsl.so.2 /usr/lib/libnsl.so.1 \
    && ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2

# Set environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_1:$LD_LIBRARY_PATH
# ENV ORACLE_HOME=/opt/oracle/instantclient_21_1

RUN npm i --verbose --maxsockets 6

# Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=installer /app/ .
COPY ./ . 

EXPOSE 80

CMD [ "npm", "run", "start" ]
