# Botswana HIE

## Tech Used

- Docker
- Golang (cli dev)
- Terraform (remote cluster setup)
- Ansible (remote cluster setup)

## Quick Start for devs (local single node)

1. If running into an error `invalid mount config for type "bind": bind source path does not exist: /tmp/logs` on running the CLI binary, run the following command: `sudo mkdir -p /tmp/logs/`.
1. `./build-custom-images.sh` - builds project images as well as the platform image
1. Initialise Docker Swarm mode: `docker swarm init`
1. Run `go cli` binary to launch the project:

   - **Linux**. From terminal run: `./instant-linux` with your selected arguments. A list of available arguments can be found in the help menu by running `./instant-linux help`
   - Mac. From terminal run: `./instant-macos` with your selected arguments. A list of available arguments can be found in the help menu by running `./instant-macos help`
     > Warning: Mac has an issue with the binary as it views the file as a security risk. See [this article](https://www.lifewire.com/fix-developer-cannot-be-verified-error-5183898) to bypass warning
   - Windows. Double click: `platform.exe` (Windows users will need to use a release version below 2.0.0)

## Quick Start for devs (remote cluster)

To set up a remote cluster environment, see [readme](https://github.com/jembi/cloud/blob/main/aws/mercury-team/README.md) in the [cloud repo](https://github.com/jembi/cloud).

1. Ensure that you have the latest instant repository checked out in the same folder that this repo is in.
1. `./build-custom-images.sh` - builds the platform image
1. Add `.env.prod` file with your remote env vars option set.

   > Each Package contains a `metadata.json` file which lists the configurable Env vars and their default values

1. Run `go cli` binary to launch the project (\*Make sure to add the `DOCKER_HOST` variable indicating your **lead Swarm manager\***, i.e. DOCKER_HOST=ssh://{lead_ip} ./instant-linux):

1. Check the current cli version in `./get-cli.sh` and run to download the binaries. This script can be run with the OS as the first parameter to download only the binary for your prefered OS.
   - **Linux**. From terminal run: `./instant-linux` with your selected arguments. A list of available arguments can be found in the help menu by running `./instant-linux help`
   - Mac. From terminal run: `./instant-macos` with your selected arguments. A list of available arguments can be found in the help menu by running `./instant-macos help`
     > Warning: Mac has an issue with the binary as it views the file as a security risk. See [this article](https://www.lifewire.com/fix-developer-cannot-be-verified-error-5183898) to bypass warning
   - Windows. Double click: `platform.exe` (Windows users will need to use a release version below 2.0.0)

## Go Cli Dev

The Go Cli scripts are kept in the [OpenHIE Package Start Kit Repo](https://github.com/openhie/package-starter-kit/tree/main/cli). To make changes to the Cli clone the repo and make your changes in the `cli` directory.

To create new binaries, create a new tag and release and then change the cli version in `./get-cli.sh` in the platform repo and run the script to download the latest.

## Platform Package Dev

The Go Cli runs all services from the `jembi/platform` docker image. When developing packages you will need to build your dev image locally with the following command:

```sh
./build-image.sh
```

As you add new packages to the platform remember to list them in `config.yaml` file. This config file controls what packages the GO CLI can launch.

For logging all output to a file, ensure that you have created the file and it has the required permissions to be written to.
The default log file with it's path is set in `.env.local` in `BASHLOG_FILE_PATH`.
The logPath property in the `config.yml` is used to create a bind mount for the logs to be stored on the host.

## Resource Allocations

The resource allocations for each service can be found in each service's respective docker-compose.yml file under `deploy.resources`. The field `reservations` specifies reserved resources for that service, per container. The field `limits` specifies that maximum amount of resources that can be used by that service, per container.

Each service's resource allocations can be piped into their .yml file through environment variables. Look at the .yml files for environment variable names per service.

### Notes on Resource Allocations

- CPU allocations are specified as a portion of the total number of cores on the host system, i.e., a CPU limit of `2` in a `6-core` system is an effective limit of `33.33%` of the CPU, and a CPU limit of `6` in a `6-core` system is an effective limit of `100%` of the CPU.
- Memory (RAM) allocations are specified as a number followed by their multiplier, i.e., 500M, 1G, 10G, etc.
- Be wary of allocating CPU limits to ELK Stack services. These seem to fail with CPU limits and their already implemented health checks.
- Take note to not allocate less memory to ELK Stack services than their JVM heap sizes.
- Exit code 137 indicates an out-of-memory failure. When running into this, it means that the service has been allocated too little memory.

## Tests

Tests are located in `/test`

### Cucumber

Tests that execute platform-linux with parameters and observe docker to assert expected outcomes

View `/test/cucumber/README.md` for more information

## Local Development Setup steps

Due the use of custom packages within the project, we need to ensure we have built the relevant docker images as well as building a new Platform image containing these packages.

Run the below command to create the custom images and rebuild a new Platform image

```
./build-custom-images.sh
```

Once the custom images have been built, you can initilize the project with the below command

```
./instant-linux package init -p dev
```

## Access to services in the dev environement

### Keycloak

For dev environment you can access the admin console using the following credentials :

- URL : http://localhost:9088/
- Realm : platform-realm
- username : admin
- password : dev_password_only

### OpenHIM

For dev environment you can access the admin console and signin with Keycloak using the following credentials :

- URL : http://localhost:9000/
- username : root@openhim.org
- password : instant101

### OpenCR

For dev environment you can access the OpenCR UI and signin using the following credentials :

- URL : http://localhost:3003/crux/#/
- username : root@intrahealth.org
- password : intrahealth

### OpenMRS

For dev environment of OpenMRS, please follow the [setup instructions here](https://github.com/BWHIE/hie-botswana/blob/main/projects/openmrs)

Once OpenMRS is properly configured locally, you can access it with the following credentials

- URL: http://localhost:8085/openmrs
- Username: admin
- Password: Y3z44AH2

### Elastic Search

For dev environment you can access the ES and sign in using the following credentials:

- URL : http://localhost:9201/
- username : elastic
- password : dev_password_only

Note: Consider creating the ES_BACKUPS folder away from tmp since it will be deleted on system restart. The default value set inside `.env.local` is `/tmp/backups`

### Kibana

For dev environment you can access the Kibana and sign in using the following credentials:

- URL : http://localhost:5601/
- username : elastic
- password : dev_password_only

### HAPI FHIR UI

Without credentials you could access : http://localhost:3447/

### FHIR IG Importer

You can install FHIR Implementation Guides through OpenHIM by making a call to the following API endpoint:

- URL: https://localhost:5001/ig
- Method: POST
- Payload Example:

```
{
    "name":"Botswana IG",
    "url":"https://build.fhir.org/ig/jembi/botswana-hie-fhir-ig/branches/master"
}
```

### Grafana

For dev environment you can access the Grafana UI and signin using the following credentials:

- URL : http://localhost:3000
- username : test
- password : dev_password_only

### Kafka (Kafdrop)

For dev environment you can access the kafka (Kafdrop) UI viewer at the below endpoint:

- URL : http://localhost:9013

#### Kafka Pub/Sub testing

For dev environment, you will need need to define an alias for the defined broker (kafka-01)

Add the below alias to your `/etc/hosts`

```
0.0.0.0      kafka-01
```

Useful commands :

- SSH into container and list kafka topics : `kafka-topics.sh --bootstrap-server localhost:9092 --list`
- SSH into container and create kafka topics : `kafka-topics.sh --bootstrap-server localhost:9092 --create --topic send-orm-to-ipms --partitions 3 --replication-factor 1`

### Deploy Omang Service in dev mode

When seeking to make changes to the Omang Service Mediator without having to repeatedly start and stop the service, one can set the `OMANG_DEV_MOUNT_FOLDER` env var in your .env.local file to the absolute path of the project to attach the service's source code files to those on your local machine. You have to set the `OMANG_DEV_MOUNT_FOLDER` variable with the absolute path to the omang-service-mediator project folder on your local machine, i.e., `OMANG_DEV_MOUNT_FOLDER=/Users/username/hie-botswana/projects/omang-service-mediator/`.

### Useful links and commands :

- Run vscode remote debugger for Node.js to debug the mediators (converter and SHR) : https://code.visualstudio.com/docs/editor/debugging
- Setting Up Oracle Database 19c Enterprise Edition for ARM (M1/M2 Macs) : https://gist.github.com/miccheng/8120d2e17818ba2a2d227554b70cd34e
