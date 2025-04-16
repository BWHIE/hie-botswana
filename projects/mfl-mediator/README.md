# MFL Mediator

A NestJS-based mediator service for interacting with the Botswana Master Facility List (MFL) API.

## Features

- FHIR-compliant endpoints for accessing MFL data
- RESTful API for locations and organizations
- Integration with OpenHIM mediator utilities
- Configurable through environment variables

## Installation

```bash
# Install dependencies
npm install

# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MFL_API_URL=https://mfldit.gov.org.bw/api/v1/mfl/fhir
```

## API Endpoints

- `GET /mfl/locations` - Get all locations from MFL
- `GET /mfl/organizations` - Get all organizations from MFL
- `GET /health` - Health check endpoint

## Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test
```

## License

UNLICENSED 