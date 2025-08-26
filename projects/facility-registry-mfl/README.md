# Facility Registry MFL API

A NestJS REST API service for accessing organizations and locations data from the Botswana Master Facility List (MFL).

## Features

- **Locations API**: Access to all location data with search and filtering capabilities
- **Organizations API**: Access to all organization data with search and filtering capabilities
- **Health Monitoring**: Built-in health check endpoints
- **Docker Support**: Containerized deployment with Docker and Docker Compose
- **TypeScript**: Full TypeScript implementation with proper interfaces
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Quick Start

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Copy data files:**

   ```bash
   mkdir -p config/data
   cp data/locations.json config/data/
   cp data/organizations.json config/data/
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

### Health Check

- `GET /api/v1/health` - Service health status

### Locations

- `GET /api/v1/locations` - Get all locations
- `GET /api/v1/locations/search?name=<name>&type=<type>` - Search locations
- `GET /api/v1/locations/:identifier` - Get location by identifier

### Organizations

- `GET /api/v1/organizations` - Get all organizations
- `GET /api/v1/organizations/search?name=<name>&type=<type>&active=<true|false>` - Search organizations
- `GET /api/v1/organizations/:identifier` - Get organization by identifier

## Search Parameters

### Locations Search

- `name`: Search by location name (partial match)
- `identifier`: Search by identifier value
- `type`: Filter by location type

### Organizations Search

- `name`: Search by organization name (partial match)
- `identifier`: Search by identifier value
- `type`: Filter by organization type
- `active`: Filter by active status (true/false)

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

Place your data files in the `config/data/` directory:

- `locations.json` - Location data
- `organizations.json` - Organization data

## Architecture

The application follows NestJS best practices with a modular structure:

```
src/
├── app.module.ts          # Root module
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
├── locations/             # Locations module
│   ├── locations.module.ts
│   ├── locations.controller.ts
│   └── locations.service.ts
└── organizations/         # Organizations module
    ├── organizations.module.ts
    ├── organizations.controller.ts
    └── organizations.service.ts
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

1. Replace the JSON files in `config/data/`
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
