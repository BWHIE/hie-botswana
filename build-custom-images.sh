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
    -t itechuw/openhim-mediator-fhir-converter:local \
    -f projects/openhim-mediator-fhir-converter/Dockerfile \
    projects/openhim-mediator-fhir-converter/ \
    --no-cache

docker build \
    -t docker.elastic.co/elasticsearch/elasticsearch:local \
    -f packages/analytics-datastore-elastic-search/Dockerfile \
    packages/analytics-datastore-elastic-search \
    --no-cache

docker build \
    -t jembi/omangsvc:local \
    -f projects/omang-service-mediator/Dockerfile \
    projects/omang-service-mediator/ \
    --no-cache

docker build \
    -t jembi/shr-mediator:local \
    -f projects/shr-mediator/Dockerfile \
    projects/shr-mediator/ \
    --no-cache

docker build \
    -t jembi/facility-registry-mfl:local \
    -f projects/facility-registry-mfl/Dockerfile \
    projects/facility-registry-mfl/ \
    --no-cache

# Install npm dependencies for the SHR (Shared Health Record) mediator project
npm install --prefix projects/shr-mediator

# Install npm dependencies for the Omang service mediator project
npm install --prefix projects/omang-service-mediator

# Install npm dependencies for the FHIR datastore HAPI FHIR importer package
./packages/fhir-datastore-hapi-fhir/importer/local-npm-install.sh

# Build the Platform to contain the above custom builds
./build-image.sh

echo "You can run the the Platform commands: E.g: ./instant-linux package init -p dev"
