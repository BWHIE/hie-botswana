# Botswana HIE Documentation

Welcome to the Botswana Health Information Exchange (HIE) documentation. This documentation provides comprehensive guides for setting up, configuring, managing, and operating the HIE platform.

## Documentation Structure

### 📚 Getting Started

- **[Setup Guide](./deployment/setup-guide.md)** - Complete setup instructions for local and remote deployments
- **[Architecture Overview](./architecture/architecture.md)** - System architecture, components, and data flows

### ⚙️ Configuration & Management

- **[Configuration Guide](./configuration/configuration.md)** - Environment variables, profiles, and package configuration
- **[Operations Guide](./sop/operations.md)** - Day-to-day operations, monitoring, and maintenance

### 🔧 Development & Troubleshooting

- **[Development Guide](./development/development.md)** - Development setup, debugging, and best practices
- **[Troubleshooting Guide](./troubleshooting/troubleshooting.md)** - Common issues and solutions

## Quick Links

### Essential Commands

**Initial Setup:**

```bash
# Build custom images
./build-custom-images.sh

# Initialize Docker Swarm
docker swarm init

# Initialize platform with dev profile
./instant-linux package init -p dev
```

**Common Operations:**

```bash
# Check service status
docker service ls

# View logs
docker service logs <service-name>

# Stop all services
./instant-linux package down -p dev

# Restart services
./instant-linux package restart -p dev
```

### Service Access (Development)

| Service         | URL                           | Credentials                        |
| --------------- | ----------------------------- | ---------------------------------- |
| Keycloak        | http://localhost:9088/        | admin / dev_password_only          |
| OpenHIM         | http://localhost:9000/        | root@openhim.org / instant101      |
| OpenCR          | http://localhost:3003/crux/#/ | root@intrahealth.org / intrahealth |
| Elasticsearch   | http://localhost:9201/        | elastic / dev_password_only        |
| Kibana          | http://localhost:5601/        | elastic / dev_password_only        |
| Grafana         | http://localhost:3000         | test / dev_password_only           |
| HAPI FHIR       | http://localhost:3447/        | No authentication                  |
| Kafka (Kafdrop) | http://localhost:9013         | No authentication                  |

## System Overview

The Botswana HIE is a comprehensive health information exchange platform built on OpenHIE principles. It facilitates the secure exchange of health information between various healthcare systems and registries in Botswana.

### Key Features

- **Interoperability Layer**: OpenHIM for transaction management and routing
- **Client Registry**: OpenCR for patient identity management
- **Shared Health Record**: Centralized storage of longitudinal patient data
- **National Registry Integration**: Omang, BDRS, and Immigration registries
- **Facility Registry**: Master Facility List (MFL) integration
- **Lab Workflow Management**: Complete lab order and result workflow
- **FHIR Compliance**: Standards-based data exchange
- **Monitoring & Analytics**: Comprehensive monitoring with Grafana, Prometheus, and Kibana

### Technology Stack

- **Containerization**: Docker & Docker Swarm
- **CLI Tool**: Go-based instant CLI
- **Databases**: PostgreSQL, Elasticsearch
- **Message Bus**: Apache Kafka
- **Mediators**: Node.js/NestJS (SHR, Omang, MFL)
- **FHIR Server**: HAPI FHIR
- **Identity Management**: Keycloak
- **Monitoring**: Prometheus, Grafana, Loki, Promtail

## Getting Help

For issues, questions, or contributions:

1. Check the [Troubleshooting Guide](./troubleshooting/troubleshooting.md) for common issues
2. Review the [Operations Guide](./sop/operations.md) for operational procedures
3. Consult the [Development Guide](./development/development.md) for development-related questions

## Documentation Updates

This documentation is maintained alongside the codebase. When making changes to the system:

1. Update relevant documentation files
2. Keep examples and commands current
3. Document new features and configuration options
4. Update troubleshooting guides with new issues and solutions
