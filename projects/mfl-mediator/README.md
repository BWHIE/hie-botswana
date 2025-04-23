# MFL Mediator

The MFL (Master Facility List) Mediator is a NestJS-based service that acts as a bridge between the Botswana Ministry of Health's MFL system and other health information systems. It provides a standardized FHIR R4 interface for accessing facility and organization data.

## Overview

The MFL Mediator serves as a middleware component that:

- Provides FHIR R4 compliant endpoints for accessing MFL data
- Handles authentication and authorization
- Manages transactions and logging
- Implements error handling and retry mechanisms
- Integrates with OpenHIM for transaction monitoring

## Project Structure

```
mfl-mediator/
├── src/
│   ├── common/                    # Shared modules and utilities
│   │   ├── openhim/              # OpenHIM integration
│   │   │   ├── openhim.module.ts
│   │   │   ├── openhim.service.ts
│   │   │   └── types.ts
│   │   └── logger/               # Logging utilities
│   ├── config/                    # Configuration management
│   ├── modules/
│   │   └── mfl/                  # MFL-specific functionality
│   │       ├── controllers/      # API endpoints
│   │       ├── services/         # Business logic
│   │       │   ├── api.service.ts
│   │       │   └── mfl.service.ts
│   │       └── errors/           # Custom error handling
│   ├── app.module.ts             # Main application module
│   └── main.ts                   # Application entry point
├── package.json
└── README.md
```

## Key Features

### 1. FHIR R4 Compliance

- Provides FHIR R4 compliant endpoints for:
  - Organizations (`/Organization`)
  - Locations (`/Location`)
  - Bundles for bulk data retrieval

### 2. Error Handling

- Custom error handling with retry mechanisms
- Detailed error logging
- Transaction tracking
- SSL certificate handling (configurable)

### 3. OpenHIM Integration

- Transaction monitoring
- Request/response tracking
- Error reporting

### 4. Configuration

- Environment-based configuration
- Flexible API endpoint configuration
- Timeout settings
- Retry policies

## API Endpoints

### Organizations

- `GET /Organization` - Get all organizations
- `GET /Organization/{id}` - Get specific organization

### Locations

- `GET /Location` - Get all locations
- `GET /Location/{id}` - Get specific location

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install dependencies
npm install

# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### Configuration

Create a `.env` file with the following variables:

```env
MFL_API_URL=https://mfldit.gov.org.bw/api/v1/mfl/fhir
MFL_TIMEOUT=30000
OPENHIM_URL=http://localhost:5001
```

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## Deployment

### Docker

```bash
# Build the image
docker build -t mfl-mediator .

# Run the container
docker run -p 3000:3000 mfl-mediator
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## Error Handling

The mediator implements a robust error handling system:

- Automatic retries for transient failures
- Detailed error logging
- Transaction tracking
- Custom error types for different scenarios

## Security Considerations

- SSL/TLS configuration
- API authentication
- Rate limiting
- Input validation

## Monitoring and Logging

- OpenHIM transaction monitoring
- Detailed error logs
- Performance metrics
- Health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the Botswana Ministry of Health IT department or create an issue in the repository.
