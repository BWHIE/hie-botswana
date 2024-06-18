FROM intrahealth/opencr:2d9fffc

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY ./config/entrypoint.sh /entrypoint.sh

COPY ./config/overrides/fhir.js /src/server/lib/routes/fhir.js

RUN ["chmod", "+x", "/entrypoint.sh"]

ENTRYPOINT ["/entrypoint.sh"]
