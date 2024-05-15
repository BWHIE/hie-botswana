# Botswana HIE - OpenMRS

The Botswana HIE OpenMRS is a project/system which isnt direclty part of the OpenHIM Platform deployment and is managed independlty

For development purposes and for testing end to end integration within the entire Botswana HIE stack, we can create a development instance of the OpenMRS system

> The `openmrs-module-botswanaemr` folder is a git sub module pointing to the [implemented repository](https://bitbucket.org/botswana-emrs/openmrs-module-botswanaemr/src/main/). Frequently `pull` from this repository to get any of the latest changes made to it

## Build the local Docker image/scripts

A dockerised version of the project can be built using the.

A few prerequistes are needed to be able to build the dockerfiles. These are checked during the build process if they are installed. If any of them are not installed, [follow the guide for installing the OpenMRS SDK](https://openmrs.atlassian.net/wiki/spaces/docs/pages/25476136/OpenMRS+SDK) and its dependencies

### Run the build script

`./build-openmrs.sh`

You should see the below output once the build has completed successfully

```
[INFO] ------------------------------------------------------------------------
[INFO] Reactor Summary for The EMR for Botswana 1.0.3-SNAPSHOT:
[INFO] 
[INFO] The EMR for Botswana ............................... SUCCESS [  1.121 s]
[INFO] The EMR for Botswana API ........................... SKIPPED
[INFO] The EMR for Botswana OMOD .......................... SKIPPED
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Start the docker containers

`docker compose -f openmrs-module-botswanaemr/docker/docker-compose.yml up -d`

You can access the OpenMRS instance on the below details

* URL: http://localhost:8080/openmrs
* Username: admin
* Password: Admin123
