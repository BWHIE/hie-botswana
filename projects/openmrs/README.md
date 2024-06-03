# Botswana HIE - OpenMRS

The Botswana HIE OpenMRS is a project/system which isnt direclty part of the OpenHIM Platform deployment and is managed independently

For development purposes and for testing end to end integration within the entire Botswana HIE stack, we can create a development instance of the OpenMRS system

The configuration of the OpenMRS instance depends on a few external repositories which have been added as git submodules.

Ensure these are pulled and created to be able to continue with the configuration and setup steps.

To fetch the sub module repository code, you need to action the below command (from within the `hie-botswana` root folder)

```
git submodule update --init
```

## Setup Prerequistes

A few prerequistes are needed to be able to build the dockerfiles. These are checked during the build process if they are installed. If any of them are not installed, [follow the guide for installing the OpenMRS SDK](https://openmrs.atlassian.net/wiki/spaces/docs/pages/25476136/OpenMRS+SDK) and its dependencies

### Maven Configuration

Configure the maven setting found under `~/.m2.setting.xml` by including the below in the `profiles` and `activeProfiles` section

Add the additional `profile`

```
<profile>
    <id>repsy</id>
    <repositories>
    <repository>
        <id>repsy</id>
        <url>https://repo.repsy.io/mvn/intellisoftdev/default</url>
    </repository>
    </repositories>
</profile>
```

Add the additional `activeProfile`

```
<activeProfile>repsy</activeProfile>
```

[See installation guide for all required steps - Manual](https://docs.google.com/document/d/1xrSdsROGDm3H6KlAZ13G408doGsGDaG5071QktwVQcs/edit)

## Run the build script (docker)

`./build-openmrs.sh`

You should see the below output once the build has completed successfully

```
[INFO] ------------------------------------------------------------------------
[INFO] Reactor Summary for The EMR for Botswana 1.0.3-SNAPSHOT:
[INFO] 
[INFO] The EMR for Botswana ............................... SUCCESS [12:02 min]
[INFO] The EMR for Botswana API ........................... SKIPPED
[INFO] The EMR for Botswana OMOD .......................... SKIPPED
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  12:02 min
[INFO] Finished at: 2024-06-03T10:06:52+02:00
[INFO] ------------------------------------------------------------------------
```

### Start the docker containers

Before running the Docker Compose scripts, some additional alterations are needed for the setup and configuration of the project

#### docker-compose.yml update

Update the `openmrs-module-botswanaemr/docker/docker-compose.yml` as indicated in the [setup steps](https://docs.google.com/document/d/1xrSdsROGDm3H6KlAZ13G408doGsGDaG5071QktwVQcs/edit#heading=h.344rvhnirz4w) - Steps 7

Additionally, updte the OpenMRS exposed port from 8080 -> 8085. This is due to a port conflict with OpenHIM API

#### Temp: Update the openmrs-distro-properties

An issue is noted with the labonfhir module which makes the initial setup take very long (+40min).
We can temporarily disable this module to speed up the initial setup. Within the openmrs-distro.properties file, comment out the `omod.labonfhir` module

#### Create the Docker instance

Run the Docker Compose script to create the OpenMRS instance

```
TOMCAT_DEV_PORT=8085 docker compose \
    -f openmrs-module-botswanaemr/docker/docker-compose.yml \
    -f openmrs-module-botswanaemr/docker/docker-compose.override.yml \
    up -d
```

You can access the OpenMRS instance on the below details

* URL: http://localhost:8085/openmrs
* Username: admin
* Password: Y3z44AH2

### NB! Post start up requisites

After successfully building and starting the OpenMRS instance, we still need to manually do a couple of steps to it working as intended. This is due to some issues with some of the modules not starting up.

* Login with the above credentials via the default login screen
* Navigate the to [Manage Modules](http://localhost:8085/openmrs/admin/modules/module.list) section within the Administration area
* Enable the **Initializer** module ONLY. This needs to be started first and on its own
    * This might might need a second restart if it hasnt started on the first attempt
    * If after a few attempts the module doesnt start up, try restarting the docker containers
* Start the remaining modules (Start All).

With all the modules successfully started, you will now be able to see the UI based off of the Botswana EMR module
