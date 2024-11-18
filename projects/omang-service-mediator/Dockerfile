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

# Install Oracle Instant Client
RUN apt-get update && apt-get install -y libaio1 \
    && mkdir -p /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && unzip instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && rm -f instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && sh -c "echo /opt/oracle/instantclient_21_1 > /etc/ld.so.conf.d/oracle-instantclient.conf" \
    && ldconfig

# Set environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_1:$LD_LIBRARY_PATH
ENV ORACLE_HOME=/opt/oracle/instantclient_21_1

RUN npm i --verbose --maxsockets 6

# Runner stage
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=installer /app/ .
COPY ./ . 

EXPOSE 80

CMD [ "npm", "run", "start" ]
