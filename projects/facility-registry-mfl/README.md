# Facility Registry MFL API

A NestJS REST API service for accessing organizations and locations data from the Botswana Master Facility List (MFL). This service acts as a fallback solution when the MFL is not accessible from within the Government Network, providing reliable access to facility and organization data for healthcare systems.

## Features

- **MFL Fallback Service**: Acts as a reliable fallback when MFL is not accessible from within the Government Network
- **Locations API**: Access to all location data with search and filtering capabilities
- **Organizations API**: Access to all organization data with search and filtering capabilities
- **Health Monitoring**: Built-in health check endpoints
- **Docker Support**: Containerized deployment with Docker and Docker Compose
- **TypeScript**: Full TypeScript implementation with proper interfaces
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Comprehensive Documentation**: Complete JSDoc documentation for all classes and methods
- **FHIR Compliance**: Follows FHIR Location and Organization resource standards
- **Flexible Search**: Multi-strategy search with partial matching and case-insensitive queries

## Fallback Service for Government Network

This API service is specifically designed to serve as a fallback solution when the Botswana Master Facility List (MFL) is not accessible from within the Government Network. In such scenarios, healthcare systems can rely on this service to:

- **Maintain Service Continuity**: Ensure healthcare applications continue to function even when MFL is unavailable
- **Provide Reliable Data Access**: Offer consistent access to facility and organization information
- **Support Critical Operations**: Enable essential healthcare workflows that depend on facility data
- **Minimize Service Disruptions**: Reduce downtime and maintain operational efficiency

The service maintains a local copy of the MFL data and provides the same API interface, ensuring seamless integration with existing healthcare systems without requiring code changes.

## Quick Start

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Copy data files:**

   ```bash
   mkdir -p config
   cp data/locations.json config/
   cp data/organizations.json config/
   ```

3. **Start development server:**

   ```bash
   npm run start:dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run start:prod
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

2. **Run in background:**

   ```bash
   docker-compose up -d --build
   ```

3. **Stop the service:**
   ```bash
   docker-compose down
   ```

## API Endpoints

### Base URL

- **Development**: `http://localhost:3004/api/v1`
- **Production**: `http://your-domain:3004/api/v1`

### Application Info

- `GET /api/v1` - Welcome message with API information and available endpoints

### Health Check

- `GET /api/v1/health` - Service health status

### Locations

- `GET /api/v1/location` - Get all locations
- `GET /api/v1/location/search?name=<name>&identifier=<identifier>&type=<type>` - Search locations
- `GET /api/v1/location/:identifier` - Get location by identifier

### Organizations

- `GET /api/v1/organization` - Get all organizations
- `GET /api/v1/organization/search?name=<name>&identifier=<identifier>&type=<type>&active=<true|false>` - Search organizations
- `GET /api/v1/organization/:identifier` - Get organization by identifier

## Search Parameters

### Locations Search

- `name`: Search by location name (partial match, case-insensitive)
- `identifier`: Search by identifier value (partial match, case-insensitive)
- `type`: Filter by location type (partial match on type display or code)

### Organizations Search

- `name`: Search by organization name (partial match, case-insensitive)
- `identifier`: Search by identifier value (partial match, case-insensitive)
- `type`: Filter by organization type (partial match on type display or code)
- `active`: Filter by active status (true/false)

## Search Capabilities

### Multi-Strategy Search

Both location and organization endpoints support flexible search strategies:

1. **Exact ID Match**: Direct lookup by resource ID
2. **Identifier Value Match**: Search by identifier value
3. **Partial Name Match**: Case-insensitive partial name matching

### Search Examples

```bash
# Search locations by name
GET /api/v1/location/search?name=Gaborone

# Search organizations by type
GET /api/v1/organization/search?type=government

# Combined search with multiple parameters
GET /api/v1/location/search?name=Hospital&type=clinic
GET /api/v1/organization/search?name=Ministry&active=true
```

## Data Structure

The service expects JSON data files in the following format:

### Locations

```json
[
  {
    "id": "string",
    "identifier": [
      {
        "system": "string",
        "value": "string"
      }
    ],
    "status": "string",
    "name": "string",
    "description": "string",
    "type": {
      "coding": [
        {
          "system": "string",
          "code": "string",
          "display": "string"
        }
      ]
    }
  }
]
```

### Organizations

```json
[
  {
    "id": "string",
    "identifier": [
      {
        "system": "string",
        "value": "string"
      }
    ],
    "active": boolean,
    "name": "string",
    "alias": ["string"],
    "type": [
      {
        "coding": [
          {
            "system": "string",
            "code": "string",
            "display": "string"
          }
        ]
      }
    ]
  }
]
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3004)
- `NODE_ENV`: Environment mode (development/production)

### Data Files

Place your data files in the `config/` directory:

- `locations.json` - Location data
- `organizations.json` - Organization data

## Architecture

The application follows NestJS best practices with a modular structure:

```
src/
├── app.module.ts          # Root module
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
├── location/              # Location module
│   ├── location.module.ts
│   ├── location.controller.ts
│   └── location.service.ts
└── organization/          # Organization module
    ├── organization.module.ts
    ├── organization.controller.ts
    └── organization.service.ts
```

## Development

### Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run linting

### Testing

- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Test coverage: `npm run test:cov`

## Docker

### Multi-stage Build

The Dockerfile uses a multi-stage build process:

1. **Builder stage**: Installs dependencies and builds the application
2. **Production stage**: Creates a minimal production image

### Health Checks

The container includes health checks that verify the API is responding correctly.

### Volume Mounts

Data files are mounted as read-only volumes for easy updates without rebuilding the container.

## Integration with Docker Swarm

For Docker Swarm deployment, the service includes:

- Resource limits and reservations
- Restart policies
- Health checks
- Network configuration

## Data Updates

To update the data:

1. Replace the JSON files in `config/`
2. Restart the container: `docker-compose restart`

## Error Handling

The API provides proper HTTP status codes:

- `200` - Success
- `404` - Resource not found
- `500` - Internal server error

## Monitoring

- Health endpoint: `/api/v1/health`
- Docker health checks
- Logging to console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
