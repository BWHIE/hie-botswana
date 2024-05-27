<!-- <p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)--> -->

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
In the present Schema, each view can be understood
[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

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

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
