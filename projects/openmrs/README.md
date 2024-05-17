# Botswana HIE - OpenMRS

The Botswana HIE OpenMRS is a project/system which isnt direclty part of the OpenHIM Platform deployment and is managed independlty

For development purposes and for testing end to end integration within the entire Botswana HIE stack, we can create a development instance of the OpenMRS system

> The `openmrs-module-botswanaemr` folder is a git sub module pointing to the [implemented repository](https://bitbucket.org/botswana-emrs/openmrs-module-botswanaemr/src/main/). Frequently `pull` from this repository to get any of the latest changes made to it

To fetch the sub module repository code, you need to action the below command

```
git submodule update --init
```

## Build the local Docker image/scripts

A dockerised version of the project can be built using the.

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

### Run the build script

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
