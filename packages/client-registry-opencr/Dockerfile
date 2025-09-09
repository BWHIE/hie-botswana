FROM intrahealth/opencr:2d9fffc

# Update sources to use archive repositories for Debian Buster
RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security/ buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian/ buster-updates main" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY ./config/entrypoint.sh /entrypoint.sh

COPY ./config/overrides/fhir.js /src/server/lib/routes/fhir.js

RUN ["chmod", "+x", "/entrypoint.sh"]

ENTRYPOINT ["/entrypoint.sh"]
