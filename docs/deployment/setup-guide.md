# Setup Guide

This guide provides step-by-step instructions for setting up the Botswana HIE platform in both local development and remote production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Remote Cluster Setup](#remote-cluster-setup)
4. [Post-Setup Verification](#post-setup-verification)
5. [Initial Configuration](#initial-configuration)

## Prerequisites

### System Requirements

**Minimum Requirements:**

- **CPU**: 4 cores
- **RAM**: 16GB
- **Disk**: 100GB free space
- **OS**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows (with WSL2)

**Recommended Requirements:**

- **CPU**: 8+ cores
- **RAM**: 32GB+
- **Disk**: 200GB+ SSD
- **Network**: Stable internet connection for image downloads

### Software Requirements

1. **Docker** (version 20.10+)

   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Docker Compose** (version 2.0+)

   ```bash
   # Usually included with Docker Desktop
   docker compose version
   ```

3. **Git**

   ```bash
   sudo apt-get install git  # Ubuntu/Debian
   brew install git          # macOS
   ```

4. **Node.js and npm** (for mediator development)

   ```bash
   # Install Node.js 18+ LTS
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. **Go** (optional, for CLI development)
   ```bash
   # Install Go 1.19+
   wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
   ```

### Network Requirements

- Ports 80, 443, 8080, 8085, 9000, 3000-3010, 3447, 5001, 5601, 9088, 9201, 9013 should be available
- For remote setup: SSH access to cluster nodes
- For production: SSL certificates for secure endpoints

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone git@github.com:BWHIE/hie-botswana.git
cd hie-botswana
```

### Step 2: Create Required Directories

```bash
# Create logs directory
sudo mkdir -p /tmp/logs/
sudo chmod 777 /tmp/logs/

# Create backups directory (for Elasticsearch)
sudo mkdir -p /tmp/backups
sudo chmod 777 /tmp/backups
```

**Note**: Consider creating the ES_BACKUPS folder away from `/tmp` since it will be deleted on system restart. Update `.env.local` with a persistent path like `/opt/hie-backups`.

### Step 3: Download CLI Binary

```bash
# Download the instant CLI tool
./get-cli.sh linux

# Or for macOS
./get-cli.sh macos

# Or download all platforms
./get-cli.sh all
```

**Note**: On macOS, you may need to bypass security warnings. See [this article](https://www.lifewire.com/fix-developer-cannot-be-verified-error-5183898).

### Step 4: Build Custom Images

The HIE platform uses custom-built images for Botswana-specific components. Build all required images:

```bash
./build-custom-images.sh
```

This script:

- Builds the OpenCR (Client Registry) image
- Builds the FHIR converter mediator image
- Builds the Elasticsearch image
- Builds the Omang Service Mediator image
- Builds the SHR (Shared Health Record) Mediator image
- Builds the Facility Registry MFL image
- Installs npm dependencies for mediators
- Builds the final platform image

**Expected Duration**: 15-30 minutes depending on system performance and network speed.

### Step 5: Initialize Docker Swarm

```bash
# Initialize Docker Swarm mode
docker swarm init

# If you have multiple network interfaces, specify the advertise address
docker swarm init --advertise-addr <your-ip-address>
```

### Step 6: Create Environment File

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # If an example exists
# Or create manually
```

**Key Environment Variables** (see [Configuration Guide](../configuration/configuration.md) for complete list):

```bash
# Logging
BASHLOG_FILE_PATH=/tmp/logs/hie.log

# Elasticsearch Backups
ES_BACKUPS=/tmp/backups

# Development Mode
OMANG_DEV_MOUNT_FOLDER=/absolute/path/to/projects/omang-service-mediator
```

### Step 7: Initialize the Platform

```bash
# Initialize with dev profile
./instant-linux package init -p dev

# Or for other profiles
./instant-linux package init -p qa
./instant-linux package init -p pilot
```

**Expected Duration**: 5-10 minutes for all services to start.

### Step 8: Verify Installation

Check that all services are running:

```bash
# List all services
docker service ls

# Check service health
docker service ps <service-name>

# View logs
docker service logs <service-name>
```

See [Post-Setup Verification](#post-setup-verification) for detailed verification steps.

## Remote Cluster Setup

### Prerequisites for Remote Setup

1. **Cluster Infrastructure**: AWS, Azure, or on-premises cluster
2. **SSH Access**: Key-based SSH access to all cluster nodes
3. **Docker Swarm**: Swarm cluster initialized with manager and worker nodes
4. **Network**: Proper network configuration between nodes

### Step 1: Prepare Cluster Infrastructure

Follow the [cloud repository setup guide](https://github.com/jembi/cloud/blob/main/aws/mercury-team/README.md) for detailed infrastructure setup.

### Step 2: Build and Transfer Images

**Option A: Build Locally and Transfer**

```bash
# Build the platform image
./build-image.sh <tag-name>

# Transfer to remote host
./remote-img-load.sh <host-ip> <username> <tag-name>

# Example
./remote-img-load.sh 192.168.1.100 ubuntu v1.0.0
```

**Option B: Build on Remote Host**

```bash
# SSH into the remote host
ssh ubuntu@<host-ip>

# Clone repository
git clone git@github.com:BWHIE/hie-botswana.git
cd hie-botswana

# Build images
./build-custom-images.sh
```

### Step 3: Configure Environment

Create environment files for each environment:

```bash
# Production environment
.env.prod

# QA environment
.env.qa

# UAT environment
.env.uat
```

Each package's `package-metadata.json` file lists configurable environment variables and their default values.

### Step 4: Set Docker Host

```bash
# Set DOCKER_HOST to point to lead Swarm manager
export DOCKER_HOST=ssh://<lead-manager-ip>

# Verify connection
docker node ls
```

### Step 5: Initialize Platform on Cluster

```bash
# Initialize with production profile
DOCKER_HOST=ssh://<lead-manager-ip> ./instant-linux package init -p prod

# Or for other environments
DOCKER_HOST=ssh://<lead-manager-ip> ./instant-linux package init -p qa
```

### Step 6: Configure Reverse Proxy

For production environments, configure nginx reverse proxy:

```bash
# Set secure mode
cd packages/reverse-proxy-nginx
./set-secure-mode.sh

# Update SSL certificates in nginx configuration
```

## Post-Setup Verification

### 1. Service Status Check

```bash
# List all services
docker service ls

# Expected services (dev profile):
# - openhim-core
# - postgres
# - hapi-fhir
# - keycloak
# - opencr
# - elasticsearch
# - kafka
# - omang-service-mediator
# - openhim-mediator-fhir-converter
# - shr-mediator
# - kibana
# - facility-registry-mfl
# - grafana
# - prometheus
# - loki
# - promtail
```

### 2. Service Health Checks

```bash
# Check individual service health
docker service ps <service-name> --no-trunc

# Check for failed services
docker service ls | grep 0/1
```

### 3. Access Service UIs

Verify you can access all service UIs:

| Service         | URL                           | Status Check         |
| --------------- | ----------------------------- | -------------------- |
| Keycloak        | http://localhost:9088/        | Login page loads     |
| OpenHIM         | http://localhost:9000/        | Dashboard accessible |
| OpenCR          | http://localhost:3003/crux/#/ | UI loads             |
| Elasticsearch   | http://localhost:9201/        | Returns cluster info |
| Kibana          | http://localhost:5601/        | Login page loads     |
| Grafana         | http://localhost:3000         | Login page loads     |
| HAPI FHIR       | http://localhost:3447/        | Base URL accessible  |
| Kafka (Kafdrop) | http://localhost:9013         | Topics visible       |

### 4. Test API Endpoints

```bash
# Test OpenHIM health
curl http://localhost:9000/heartbeat

# Test HAPI FHIR metadata
curl http://localhost:3447/fhir/metadata

# Test Elasticsearch
curl -u elastic:dev_password_only http://localhost:9201/_cluster/health

# Test SHR Mediator
curl http://localhost:3000/health

# Test Omang Service
curl http://localhost:3004/api/patient/Get
```

### 5. Verify Kafka Topics

```bash
# SSH into Kafka container
docker exec -it $(docker ps -q -f name=kafka) bash

# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Expected topics:
# - send-adt-to-ipms
# - send-orm-to-ipms
# - save-pims-patient
# - save-ipms-patient
# - handle-oru-from-ipms
# - handle-adt-from-ipms
# - dmq
```

### 6. Check Logs

```bash
# View service logs
docker service logs <service-name> --tail 100

# Check for errors
docker service logs <service-name> 2>&1 | grep -i error

# View all logs from log file
tail -f /tmp/logs/hie.log
```

## Initial Configuration

### 1. Configure Keycloak

1. Access Keycloak: http://localhost:9088/
2. Login with: `admin` / `dev_password_only`
3. Navigate to `platform-realm`
4. Configure clients, users, and roles as needed

### 2. Configure OpenHIM

1. Access OpenHIM: http://localhost:9000/
2. Login with: `root@openhim.org` / `instant101`
3. Verify mediators are registered:
   - Shared Health Record Mediator
   - Omang Service Mediator
   - FHIR Converter Mediator
4. Configure channels and routes

### 3. Install FHIR Implementation Guide

```bash
curl -X POST https://localhost:5001/ig \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Botswana IG",
    "url": "https://build.fhir.org/ig/jembi/botswana-hie-fhir-ig/branches/master"
  }'
```

### 4. Configure MFL Data

If using the Facility Registry MFL service:

```bash
# Sync with MFL API (if accessible)
curl -X POST http://localhost:3005/api/v1/sync/trigger

# Or manually update data files
# Edit: packages/facility-registry-mfl/config/data/locations.json
# Edit: packages/facility-registry-mfl/config/data/organizations.json
```

### 5. Configure Monitoring

1. Access Grafana: http://localhost:3000
2. Login with: `test` / `dev_password_only`
3. Import dashboards from `packages/monitoring/grafana/dashboards/`
4. Configure data sources (Prometheus, Loki)

## Next Steps

After successful setup:

1. Review the [Architecture Guide](../architecture/architecture.md) to understand system components
2. Read the [Configuration Guide](../configuration/configuration.md) for detailed configuration options
3. Consult the [Operations Guide](../sop/operations.md) for day-to-day management
4. Check the [Development Guide](../development/development.md) for development workflows

## Troubleshooting Setup Issues

If you encounter issues during setup:

1. Check the [Troubleshooting Guide](../troubleshooting/troubleshooting.md)
2. Verify all prerequisites are met
3. Check Docker and Swarm status: `docker info` and `docker node ls`
4. Review service logs: `docker service logs <service-name>`
5. Ensure ports are not in use: `netstat -tulpn | grep <port>`

## Additional Resources

- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)
- [OpenHIE Package Starter Kit](https://github.com/openhie/package-starter-kit)
- [FHIR Documentation](https://www.hl7.org/fhir/)
