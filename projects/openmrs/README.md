# Botswana HIE - OpenMRS

The Botswana HIE OpenMRS is a project/system which isnt direclty part of the OpenHIM Platform deployment and is managed independently

For development purposes and for testing end to end integration within the entire Botswana HIE stack, we can create a development instance of the OpenMRS system

The configuration of the OpenMRS instance depends on a few external repositories which have been added as git submodules.

Ensure these are pulled and created to be able to continue with the configuration and setup steps.

To fetch the sub module repository code, you need to action the below command (from within the `hie-botswana` root folder)

```
git submodule update --init
```

Foreach of the submodules, we need to build a local package them to be accessible. Execute the below within each of the submodules

```
mvn clean install
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
[INFO] The EMR for Botswana ............................... SUCCESS [ 36.154 s]
[INFO] The EMR for Botswana API ........................... SKIPPED
[INFO] The EMR for Botswana OMOD .......................... SKIPPED
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  36.510 s
[INFO] Finished at: 2024-05-15T11:23:31+02:00
[INFO] ------------------------------------------------------------------------
```

### Start the docker containers

Before running the Docker Compose scripts, some additional alterations are needed for the setup and configuration of the project

#### docker-compose.yml update

Update the `openmrs-module-botswanaemr/docker/docker-compose.yml` script to include the database dump as a volume

```
volumes:
    ...
    - ./dbdump:/docker-entrypoint-initdb.d
```

#### openmrs-distro.properties update

The modules which have been built locally will have generated a new module version. These versions need to be updated accordingly within the `openmrs-module-botswanaemr/openmrs-distro.properties` file to ensure they can be installed correctly

#### Create the Docker instance

Run the Docker Compose script to create the OpenMRS instance

```
docker compose \
    -f openmrs-module-botswanaemr/docker/docker-compose.yml \
    -f openmrs-module-botswanaemr/docker/docker-compose.override.yml \
    up -d
```

You can access the OpenMRS instance on the below details

* URL: http://localhost:8080/openmrs
* Username: admin
* Password: Admin123
