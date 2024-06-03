# Omang Service Mediator 

This service provides a RESTful API for three key national registries: the Omang Registry, the Births and Deaths (BDRS) Registry, and the Immigration Service Registry. The service is designed to run as an OpenHIM mediator and is responsible for providing an interface to the three registries, as well as for transforming the data from the registries into the FHIR format.

## Overview
The entire codebase was migrated to NodeJS using the NestJS framework in order to to simplify the technology stack and expedite development. The purpose
of the present work is to mitigate the effects of the high workload required by the older Omang Service implementation.  

## Description
The service used to be built as a C# .NET Core Web API and is designed to run as an OpenHIM mediator. The API layer connects to an Oracle database View, which provides the sole data source for each of the three registries. The API layer is responsible for transforming the data from the Oracle database into the FHIR format, and for providing the required query capabilities to retrieve patients by both their unique identifiers, as well as by their demographic information. The service runs as a Docker container and connects to an OpenHIM instance as a mediator. OpenHIM provides dedicated channels that manage and secure the communication between various clients and the service.

## Schema 
The service interacts with external national registries: external Oracle databases. There are three key national registries. Each Registry has a different owner from an Oracle DB standpoint.
### Omang Registry 
The Omang Registry is comprised of a single view and an owner. The values retrieved can either be in FHIR format or Omang Entity. 
### BDRS Registry
The BDRS Registry is comprised of two views (Births and Deaths). The values retrieved can either be in FHIR format or seperate BDRS entities :Birth Record, Death Record, Birthdeath Record which is a join between two views/tables: Births and Deaths
### Immigration Registry 
The Omang Registry is comprised of a single view and an owner. The values retrieved can either be in FHIR format or Immigration Record. 

#### Sidenote:
In the present Schema, each view can be understood as a seperate table corresponding to a given national registry.

## Potential Enhancements: 
Although the present work responds to the required specification, some improvements can be made. The current mapping to the FHIR standard only retrieves
basic information about the different mapped entities and doesn't take into account potential valuable insights that could be extracted from the Schema.
One way to surmount this inconvenience is to enhance the FHIR mapping by including more details about the entities into the FHIR patient schema, taking into consideration reference resources or adding custom extensions to the FHIR resource itself.


## Issues 
In order to secure connections to multiple databases, a shared connection among multiple databases is not possible in our context since each registry
has a different owner. For each view, we need to instance a new connection in order to be able to run queries appropriately 

## Database Connectvity 

A system identifier (SID) identifies each Oracle database instance for internal connectivity on the Oracle server itself.
In the older implementation, the SID for the different Oracle databases is XE (Express edition). The default value for most OracleDB Docker images for the SID variable is PDB (Pluggable Database) and some Docker images may not support the XE service. This has to be taken into consideration if the OracleDB docker image is to be changed in the future.

In the present implementation, the default for the Oracle SID is FREE.

Moreover, there has been an upgrade in the OracleDB version because the older version's driver isn't compatible with NodeJS and database connections cannot be instantiated. 



## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
## NOTE
If the Omang Service Mediator fails to start as a container inside a platform package, consider restarting the NestJs app container manually because sometimes the app is mounted before the database ever gets seeded. 

