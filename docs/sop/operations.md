# Operations Guide

This guide covers day-to-day operations, monitoring, maintenance, and management of the Botswana HIE platform.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Service Management](#service-management)
3. [Monitoring & Health Checks](#monitoring--health-checks)
4. [Backup & Recovery](#backup--recovery)
5. [Log Management](#log-management)
6. [Performance Optimization](#performance-optimization)
7. [Security Operations](#security-operations)
8. [Maintenance Procedures](#maintenance-procedures)

## Daily Operations

### Starting the Platform

```bash
# Initialize platform with specific profile
./instant-linux package init -p dev

# Or restart existing services
./instant-linux package restart -p dev
```

### Stopping the Platform

```bash
# Stop all services
./instant-linux package down -p dev

# Stop specific service
docker service rm <service-name>
```

### Checking Platform Status

```bash
# List all services
docker service ls

# Check service health
docker service ps <service-name>

# View service details
docker service inspect <service-name>
```

### Viewing Logs

```bash
# View service logs
docker service logs <service-name> --tail 100 -f

# View logs from file
tail -f /tmp/logs/hie.log

# Search logs
docker service logs <service-name> 2>&1 | grep -i "error"
```

## Service Management

### Starting/Stopping Services

```bash
# Start a stopped service
docker service update --replicas 1 <service-name>

# Stop a service (scale to 0)
docker service update --replicas 0 <service-name>

# Restart a service
docker service update --force <service-name>
```

### Scaling Services

```bash
# Scale service to multiple replicas
docker service scale <service-name>=3

# Update service with new replica count
docker service update --replicas 3 <service-name>
```

### Updating Services

```bash
# Update service image
docker service update --image <new-image> <service-name>

# Update service with new environment variables
docker service update --env-add KEY=value <service-name>

# Rollback service update
docker service rollback <service-name>
```

### Service Health Checks

```bash
# Check service health status
docker service ps <service-name> --no-trunc

# Check for failed services
docker service ls | grep "0/1"

# Restart failed services
docker service update --force <service-name>
```

## Monitoring & Health Checks

### Service Health Monitoring

#### OpenHIM Health

```bash
# Check OpenHIM heartbeat
curl http://localhost:9000/heartbeat

# Check OpenHIM status
curl http://localhost:9000/status
```

#### HAPI FHIR Health

```bash
# Check FHIR server metadata
curl http://localhost:3447/fhir/metadata

# Check server capabilities
curl http://localhost:3447/fhir/metadata | jq '.rest[0].resource'
```

#### Elasticsearch Health

```bash
# Check cluster health
curl -u elastic:dev_password_only http://localhost:9201/_cluster/health

# Check node status
curl -u elastic:dev_password_only http://localhost:9201/_nodes
```

#### Kafka Health

```bash
# Check Kafka topics
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 --list

# Check consumer groups
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
```

### Grafana Dashboards

Access Grafana: http://localhost:3000

**Key Dashboards:**

- Docker Swarm Monitor
- OpenHIM Transactions
- Kafka Topics and Consumers
- Application Performance
- Infrastructure Metrics

**Metrics to Monitor:**

- Service availability and uptime
- Transaction throughput
- Response times
- Error rates
- Resource utilization (CPU, memory, disk)
- Kafka topic lag
- Database connection pool usage

### Prometheus Metrics

Access Prometheus: http://localhost:9090

**Key Metrics:**

- `docker_swarm_service_tasks_running`
- `docker_swarm_service_tasks_desired`
- `http_request_duration_seconds`
- `kafka_consumer_lag_sum`
- `postgres_connections`

### Kibana Log Analysis

Access Kibana: http://localhost:5601

**Useful Queries:**

```
# Search for errors
level: ERROR

# Search by service
service: shr-mediator

# Search by time range
@timestamp: [now-1h TO now]
```

## Backup & Recovery

### Database Backups

#### PostgreSQL Backup

```bash
# Backup HAPI FHIR database
docker exec $(docker ps -q -f name=postgres) \
  pg_dump -U hapi hapi > hapi_backup_$(date +%Y%m%d).sql

# Backup OpenHIM database
docker exec $(docker ps -q -f name=postgres) \
  pg_dump -U openhim openhim > openhim_backup_$(date +%Y%m%d).sql
```

#### PostgreSQL Restore

```bash
# Restore HAPI FHIR database
docker exec -i $(docker ps -q -f name=postgres) \
  psql -U hapi hapi < hapi_backup_20240101.sql

# Restore OpenHIM database
docker exec -i $(docker ps -q -f name=postgres) \
  psql -U openhim openhim < openhim_backup_20240101.sql
```

### Elasticsearch Backups

#### Create Snapshot

```bash
# Create snapshot repository
curl -X PUT "http://localhost:9201/_snapshot/backup_repo" \
  -u elastic:dev_password_only \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/backups/elasticsearch"
    }
  }'

# Create snapshot
curl -X PUT "http://localhost:9201/_snapshot/backup_repo/snapshot_$(date +%Y%m%d)" \
  -u elastic:dev_password_only
```

#### Restore Snapshot

```bash
# List snapshots
curl -X GET "http://localhost:9201/_snapshot/backup_repo/_all" \
  -u elastic:dev_password_only

# Restore snapshot
curl -X POST "http://localhost:9201/_snapshot/backup_repo/snapshot_20240101/_restore" \
  -u elastic:dev_password_only
```

### Configuration Backups

```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  config.yaml \
  .env.* \
  packages/*/config/

# Backup to remote location
scp config_backup_*.tar.gz user@backup-server:/backups/
```

### Backup Schedule

**Recommended Schedule:**

- **Daily**: Database backups (PostgreSQL, Elasticsearch)
- **Weekly**: Full configuration backups
- **Monthly**: Complete system snapshot

**Automation:**
Set up cron jobs or scheduled tasks:

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Log Management

### Log Locations

**Service Logs:**

- Docker service logs: `docker service logs <service-name>`
- Log file: `/tmp/logs/hie.log` (configurable via `BASHLOG_FILE_PATH`)

**Application Logs:**

- SHR Mediator: Container logs
- Omang Service: Container logs
- Facility Registry: Container logs

### Log Rotation

**Docker Log Rotation:**
Configure in `docker-compose.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Application Log Rotation:**
Configure in service configuration:

- SHR Mediator: `SHR_LOGGER_MAX_LOG_SIZE`, `SHR_LOGGER_MAX_NUM_OF_LOGS`

### Log Analysis

**Using Kibana:**

1. Access Kibana: http://localhost:5601
2. Create index patterns
3. Build visualizations
4. Create dashboards

**Using Command Line:**

```bash
# Search logs
docker service logs <service-name> | grep -i "error"

# Count errors
docker service logs <service-name> 2>&1 | grep -i "error" | wc -l

# Export logs
docker service logs <service-name> > service_logs.txt
```

## Performance Optimization

### Resource Monitoring

```bash
# Check resource usage
docker stats

# Check service resource usage
docker service ps <service-name> --no-trunc

# Check node resources
docker node ls
docker node inspect <node-name>
```

### Performance Tuning

#### Database Optimization

**PostgreSQL:**

- Tune `shared_buffers`, `work_mem`, `maintenance_work_mem`
- Monitor connection pool usage
- Regular VACUUM and ANALYZE

**Elasticsearch:**

- Tune JVM heap size
- Optimize index settings
- Monitor shard allocation

#### Kafka Optimization

```bash
# Check topic partition count
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 --describe

# Increase partitions if needed
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic <topic-name> --partitions 6
```

#### Service Scaling

Scale services based on load:

```bash
# Scale SHR Mediator
docker service scale shr-mediator=3

# Scale Kafka consumers
# Update consumer group configuration
```

### Cache Management

Clear caches when needed:

```bash
# Clear application caches (service-specific)
# Restart service to clear in-memory caches
docker service update --force <service-name>
```

## Security Operations

### Credential Management

**Rotate Passwords:**

1. Update passwords in environment files
2. Update service configurations
3. Restart affected services

**Use Docker Secrets (Production):**

```bash
# Create secret
echo "new-password" | docker secret create db_password -

# Use in service
docker service update --secret-add db_password <service-name>
```

### Access Control

**Keycloak User Management:**

1. Access Keycloak: http://localhost:9088/
2. Navigate to Users
3. Create/update/disable users
4. Assign roles

**OpenHIM Channel Security:**

1. Access OpenHIM: http://localhost:9000/
2. Configure channels
3. Set authentication requirements
4. Configure IP whitelisting if needed

### Security Monitoring

**Monitor for:**

- Failed authentication attempts
- Unauthorized access attempts
- Unusual traffic patterns
- Service vulnerabilities

**Review Logs:**

```bash
# Check authentication failures
docker service logs keycloak | grep -i "failed\|unauthorized"

# Check OpenHIM access logs
docker service logs openhim-core | grep -i "401\|403"
```

### SSL/TLS Management

**Update Certificates:**

1. Obtain new certificates
2. Update nginx configuration
3. Restart reverse proxy service

```bash
cd packages/reverse-proxy-nginx
# Update certificate files
./set-secure-mode.sh
docker service update --force reverse-proxy-nginx
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily

- Check service health
- Review error logs
- Monitor resource usage
- Verify backups completed

#### Weekly

- Review performance metrics
- Check disk space
- Review security logs
- Update documentation

#### Monthly

- Full system backup
- Review and update configurations
- Performance optimization
- Security audit

### System Updates

#### Update Platform Image

```bash
# Build new platform image
./build-image.sh <new-tag>

# Update services
docker service update --image jembi/platform:<new-tag> <service-name>
```

#### Update Custom Images

```bash
# Rebuild custom images
./build-custom-images.sh

# Update platform image
./build-image.sh
```

#### Update Dependencies

```bash
# Update npm dependencies (for mediators)
cd projects/shr-mediator
npm update
npm install

cd ../omang-service-mediator
npm update
npm install

# Rebuild images
./build-custom-images.sh
```

### Data Maintenance

#### Database Maintenance

**PostgreSQL:**

```bash
# VACUUM and ANALYZE
docker exec $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "VACUUM ANALYZE;"
```

**Elasticsearch:**

```bash
# Force merge indices
curl -X POST "http://localhost:9201/_forcemerge" \
  -u elastic:dev_password_only
```

#### Cleanup Old Data

```bash
# Remove old Docker images
docker image prune -a

# Remove old containers
docker container prune

# Remove old volumes (careful!)
docker volume prune
```

### Disaster Recovery

#### Service Recovery

```bash
# Restart failed services
docker service update --force <service-name>

# Scale down and up
docker service scale <service-name>=0
docker service scale <service-name>=1
```

#### Full System Recovery

1. Restore databases from backups
2. Restore configuration files
3. Rebuild and deploy services
4. Verify all services are running
5. Test critical workflows

## Useful Commands Reference

### Docker Swarm Commands

```bash
# List nodes
docker node ls

# Inspect node
docker node inspect <node-name>

# List services
docker service ls

# Service details
docker service inspect <service-name>

# Service logs
docker service logs <service-name> --tail 100 -f

# Update service
docker service update <options> <service-name>

# Remove service
docker service rm <service-name>
```

### Platform CLI Commands

```bash
# Initialize platform
./instant-linux package init -p <profile>

# Stop platform
./instant-linux package down -p <profile>

# Restart platform
./instant-linux package restart -p <profile>

# Help
./instant-linux help
```

### Utility Scripts

```bash
# Purge local environment
./purge-local.sh

# Prune containers on remote nodes
./prune-containers.sh <host1> <host2>

# Purge remote nodes
./purge-nodes.sh <host1> <host2>

# Load image to remote host
./remote-img-load.sh <host> <user> <tag>
```

## Troubleshooting Operations

For detailed troubleshooting, see the [Troubleshooting Guide](../troubleshooting/troubleshooting.md).

**Common Issues:**

- Service won't start: Check logs, verify dependencies
- High resource usage: Scale services, optimize configuration
- Connection errors: Verify network, check service names
- Performance issues: Monitor metrics, optimize queries

## Next Steps

- Review [Configuration Guide](../configuration/configuration.md) for configuration details
- Consult [Troubleshooting Guide](../troubleshooting/troubleshooting.md) for issue resolution
- Read [Development Guide](../development/development.md) for development workflows
