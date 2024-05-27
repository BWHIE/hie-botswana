#!/bin/bash

docker build \
    -t itechuw/opencr:local \
    -f packages/client-registry-opencr/Dockerfile \
    packages/client-registry-opencr \
    --no-cache

# Build a Botswana Specific ElasticSearch instance
# TEMP: Ensure the /tmp/backups folder exists
mkdir /tmp/backups

docker build \
    -t docker.elastic.co/elasticsearch/elasticsearch:local \
    -f packages/analytics-datastore-elastic-search/Dockerfile \
    packages/analytics-datastore-elastic-search \
    --no-cache

docker build \
    -t jembi/omangsvc:latest \
    -f projects/omang-service-mediator/Dockerfile \
    projects/omang-service-mediator/ \
    --no-cache

# Build the Platform to contain the above custom builds
./build-image.sh

echo "You can run the the Platform commands: E.g: ./instant-linux package init -p dev"
