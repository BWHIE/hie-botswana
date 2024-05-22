# ====================================
# Intrahealth/opencr:latest - New build
# Build a latest opencr image based on codebase in master branch
# The below Dockerfile commands are copied from the Intrahealth/opencr Dockerfile
# https://github.com/intrahealth/client-registry/blob/master/docker/opencr/Dockerfile

FROM node:16-slim as opencr-master

RUN mkdir -p /var/log
ARG branch=master
RUN apt-get -qq update && apt-get install -y -qq git && apt-get install -y --no-install-recommends wget
RUN git clone --branch ${branch} https://github.com/intrahealth/client-registry /src/

WORKDIR /src/server
RUN npm install

RUN cp /src/server/config/config_docker_template.json /src/server/config/config_docker.json
RUN cp /src/server/config/config_cicd_template.json /src/server/config/config_cicd.json

ARG NODE_ENV=docker
ENV NODE_ENV=$NODE_ENV

EXPOSE 3000

# ====================================

FROM opencr-master

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY ./config/entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]

ENTRYPOINT ["/entrypoint.sh"]
