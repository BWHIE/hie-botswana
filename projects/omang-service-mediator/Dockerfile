# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY ./ .  

# Installer stage
FROM node:18-alpine AS installer

WORKDIR /app

COPY --from=builder /app/package*.json .

RUN npm update -g npm
RUN npm config set registry https://registry.npmjs.com/
RUN npm i --verbose --maxsockets 6 --legacy-peer-deps

# Runner stage
FROM node:18 AS runner

# Install Oracle Instant Client dependencies
RUN apt-get update && \
    apt-get install -y libaio1 wget unzip

# Install Oracle Instant Client
WORKDIR /opt/oracle
RUN wget --no-check-certificate --header "Cookie: oraclelicense=accept-securebackup-cookie" \
    -O instantclient.zip https://download.oracle.com/otn_software/linux/instantclient/219000/instantclient-basic-linux.x64-21.9.0.0.0dbru.zip && \
    unzip instantclient.zip && \
    rm -f instantclient.zip && \
    sh -c "echo /opt/oracle/instantclient_21_9 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
    ldconfig

# Set Oracle environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9
ENV PATH=/opt/oracle/instantclient_21_9:$PATH
ENV TNS_ADMIN=/opt/oracle/instantclient_21_9
ENV ORACLE_HOME=/opt/oracle/instantclient_21_9
ENV NODE_ORACLEDB_INIT_ORACLE_CLIENT_LIB_DIR=/opt/oracle/instantclient_21_9

WORKDIR /app

COPY --from=installer /app/ .
COPY ./ . 

EXPOSE 80

CMD [ "npm", "run", "start" ]
