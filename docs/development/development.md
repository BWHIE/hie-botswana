# Development Guide

This guide covers development workflows, debugging, testing, and best practices for working with the Botswana HIE platform codebase.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflows](#development-workflows)
4. [Debugging](#debugging)
5. [Testing](#testing)
6. [Code Standards](#code-standards)
7. [Contributing](#contributing)

## Development Environment Setup

### Prerequisites

1. **Node.js 18+ LTS**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Verify installation
   node --version
   npm --version
   ```

2. **TypeScript**

   ```bash
   npm install -g typescript
   npm install -g ts-node
   ```

3. **Docker & Docker Compose**

   ```bash
   # Already covered in Setup Guide
   ```

4. **Development Tools**

   ```bash
   # VS Code (recommended)
   # Or your preferred IDE

   # Git
   sudo apt-get install git
   ```

### Initial Setup

1. **Clone Repository**

   ```bash
   git clone git@github.com:BWHIE/hie-botswana.git
   cd hie-botswana
   ```

2. **Install Dependencies**

   ```bash
   # SHR Mediator
   cd projects/shr-mediator
   npm install

   # Omang Service Mediator
   cd ../omang-service-mediator
   npm install

   # Facility Registry MFL
   cd ../facility-registry-mfl
   npm install
   ```

3. **Development Mode Configuration**
   ```bash
   # Set up development mounts in .env.local
   OMANG_DEV_MOUNT_FOLDER=/absolute/path/to/projects/omang-service-mediator
   SHR_DEV_MODE=true
   ```

## Project Structure

### Repository Layout

```
hie-botswana/
├── packages/              # Platform packages
│   ├── shr-mediator/
│   ├── omang-service-mediator/
│   ├── facility-registry-mfl/
│   ├── fhir-datastore-hapi-fhir/
│   └── ...
├── projects/              # Application projects
│   ├── shr-mediator/
│   ├── omang-service-mediator/
│   ├── facility-registry-mfl/
│   └── ...
├── config.yaml            # Platform configuration
├── build-custom-images.sh # Build script
└── docs/                  # Documentation
```

### Mediator Projects

#### SHR Mediator Structure

```
projects/shr-mediator/
├── src/
│   ├── botswana/          # Botswana-specific module
│   ├── common/            # Common SHR features
│   ├── openhim/           # OpenHIM mediator module
│   └── main.ts            # Entry point
├── test/                  # Tests
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### Omang Service Mediator Structure

```
projects/omang-service-mediator/
├── src/
│   ├── omang/             # Omang registry module
│   ├── bdrs/              # BDRS registry module
│   ├── immigration/       # Immigration registry module
│   ├── common/            # Shared modules
│   └── main.ts            # Entry point
├── test/
├── package.json
└── tsconfig.json
```

## Development Workflows

### Local Development with Hot Reload

#### SHR Mediator Development

1. **Start Platform in Dev Mode**

   ```bash
   ./instant-linux package init -p dev
   ```

2. **Enable Development Mount**

   ```bash
   # In .env.local
   SHR_DEV_MODE=true
   # Or use docker-compose.dev.yml with volume mounts
   ```

3. **Run Locally (Outside Docker)**

   ```bash
   cd projects/shr-mediator
   npm run start:dev
   ```

4. **Make Changes**
   - Edit source files
   - Changes auto-reload (if using watch mode)
   - Or restart manually

#### Omang Service Development

1. **Set Development Mount Path**

   ```bash
   # In .env.local
   OMANG_DEV_MOUNT_FOLDER=/absolute/path/to/projects/omang-service-mediator
   ```

2. **Run Locally**

   ```bash
   cd projects/omang-service-mediator
   npm run start:dev
   ```

3. **Connect to Platform Services**
   - Update service URLs to point to Docker services
   - Use service names: `http://postgres:5432`, `http://openhim-core:8080`

### Building and Testing Changes

#### Build Custom Images

```bash
# After making changes to mediators
./build-custom-images.sh

# This rebuilds:
# - SHR Mediator image
# - Omang Service Mediator image
# - Facility Registry MFL image
# - Platform image
```

#### Test Changes

```bash
# Run unit tests
cd projects/shr-mediator
npm test

# Run e2e tests
npm run test:e2e

# Check linting
npm run lint
```

#### Deploy Changes

```bash
# Rebuild and restart services
./build-custom-images.sh
docker service update --force shr-mediator
docker service update --force omang-service-mediator
```

### Working with Dependencies

#### Adding New Dependencies

```bash
# Add dependency
cd projects/shr-mediator
npm install <package-name>

# Add dev dependency
npm install --save-dev <package-name>

# Update package-lock.json
npm install
```

#### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update <package-name>

# Update all packages (careful!)
npm update
```

## Debugging

### VS Code Debugging

#### Setup Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug SHR Mediator",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:dev"],
      "cwd": "${workspaceFolder}/projects/shr-mediator",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to SHR Mediator",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/projects/shr-mediator",
      "remoteRoot": "/app"
    }
  ]
}
```

#### Debugging in Docker

1. **Enable Debug Mode**

   ```bash
   # Add to docker-compose.dev.yml
   environment:
     - NODE_OPTIONS=--inspect=0.0.0.0:9229
   ports:
     - "9229:9229"
   ```

2. **Attach Debugger**
   - Set breakpoints in VS Code
   - Start debugging with "Attach to SHR Mediator"
   - Trigger code execution

### Logging

#### Application Logging

```typescript
// Use appropriate log level
logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message", error);
```

#### Viewing Logs

```bash
# Real-time logs
docker service logs -f shr-mediator

# Filter logs
docker service logs shr-mediator 2>&1 | grep -i "error"

# Export logs
docker service logs shr-mediator > shr-logs.txt
```

### Common Debugging Scenarios

#### Debug API Requests

```typescript
// Add request logging
logger.debug("Request:", {
  method: req.method,
  url: req.url,
  headers: req.headers,
  body: req.body,
});
```

#### Debug Kafka Messages

```typescript
// Log Kafka messages
consumer.on("message", (message) => {
  logger.debug("Kafka message:", {
    topic: message.topic,
    partition: message.partition,
    value: message.value,
  });
});
```

#### Debug Database Queries

```typescript
// Enable query logging
// In database configuration
logging: true,
logger: 'debug'
```

## Testing

### Unit Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/specific.test.ts

# Run with coverage
npm run test:cov

# Watch mode
npm test -- --watch
```

#### Writing Tests

```typescript
// Example test structure
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', async () => {
    // Arrange
    const input = { ... };

    // Act
    const result = await service.doSomething(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
  });
});
```

### Integration Testing

#### E2E Tests

```bash
# Run e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- test/e2e/specific.e2e-spec.ts
```

#### API Testing

```bash
# Use curl or Postman
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# Or use testing tools
npm install --save-dev supertest
```

### Manual Testing

#### Test Lab Workflow

1. **Send Lab Order**

   ```bash
   curl -X POST http://localhost:9000/SHR/lab \
     -H "Content-Type: application/fhir+json" \
     -d @test-data/lab-order.json
   ```

2. **Check Kafka Topics**

   ```bash
   docker exec -it $(docker ps -q -f name=kafka) \
     kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic send-adt-to-ipms --from-beginning
   ```

3. **Verify FHIR Resources**
   ```bash
   curl http://localhost:3447/fhir/ServiceRequest?patient=<patient-id>
   ```

## Code Standards

### TypeScript Standards

#### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs

#### Example

```typescript
/**
 * Processes a lab order and sends it to IPMS
 * @param bundle - FHIR Bundle containing the lab order
 * @returns Promise resolving to the processed bundle
 */
async function processLabOrder(bundle: Bundle): Promise<Bundle> {
  // Implementation
}
```

### File Organization

- One class/interface per file
- Group related files in modules
- Use index files for exports
- Keep files focused and small

### Error Handling

```typescript
// Use try-catch for async operations
try {
  const result = await asyncOperation();
  return result;
} catch (error) {
  logger.error("Operation failed", error);
  throw new Error("Descriptive error message");
}

// Validate inputs
if (!input || !input.property) {
  throw new Error("Invalid input: property is required");
}
```

### Async/Await

```typescript
// Prefer async/await over promises
async function processData(data: Data): Promise<Result> {
  const step1 = await doStep1(data);
  const step2 = await doStep2(step1);
  return step2;
}

// Handle errors properly
async function safeOperation() {
  try {
    return await riskyOperation();
  } catch (error) {
    logger.error("Operation failed", error);
    return defaultValue;
  }
}
```

## Contributing

### Development Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**

   - Write code
   - Add tests
   - Update documentation

3. **Test Changes**

   ```bash
   npm test
   npm run lint
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/my-feature
   # Create pull request
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

### Code Review Process

1. **Self-Review**

   - Check code quality
   - Run tests
   - Verify documentation

2. **Create PR**

   - Clear description
   - Link related issues
   - Request reviewers

3. **Address Feedback**
   - Respond to comments
   - Make requested changes
   - Update PR

### Adding New Packages

1. **Create Package Structure**

   ```bash
   mkdir -p packages/new-package
   cd packages/new-package
   ```

2. **Add package-metadata.json**

   ```json
   {
     "id": "new-package",
     "name": "New Package",
     "description": "Package description",
     "type": "infrastructure",
     "version": "0.0.1",
     "dependencies": [],
     "environmentVariables": {}
   }
   ```

3. **Add to config.yaml**

   ```yaml
   packages:
     - new-package

   profiles:
     - name: dev
       packages:
         - new-package
   ```

4. **Create Docker Configuration**
   - `docker-compose.yml`
   - `Dockerfile` (if needed)
   - `swarm.sh` (if needed)

## Useful Development Commands

### Quick Commands

```bash
# Rebuild and restart service
./build-custom-images.sh && docker service update --force shr-mediator

# View logs while developing
docker service logs -f shr-mediator

# Run tests
cd projects/shr-mediator && npm test

# Check code style
npm run lint

# Format code
npm run format
```

### Docker Commands

```bash
# Rebuild specific image
docker build -t jembi/shr-mediator:local -f projects/shr-mediator/Dockerfile projects/shr-mediator

# Run container locally for testing
docker run -it --rm jembi/shr-mediator:local

# Execute command in running container
docker exec -it $(docker ps -q -f name=shr-mediator) sh
```

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [FHIR Documentation](https://www.hl7.org/fhir/)
- [OpenHIE Documentation](https://ohie.org/)

## Next Steps

- Review [Setup Guide](../deployment/setup-guide.md) for environment setup
- Read [Architecture Guide](../architecture/architecture.md) for system understanding
- Consult [Operations Guide](../sop/operations.md) for deployment procedures
