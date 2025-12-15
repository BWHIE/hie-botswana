# Troubleshooting Guide

This guide provides solutions to common issues encountered when setting up, configuring, and operating the Botswana HIE platform.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Service Startup Issues](#service-startup-issues)
3. [Connection Issues](#connection-issues)
4. [Performance Issues](#performance-issues)
5. [Data Issues](#data-issues)
6. [Authentication Issues](#authentication-issues)
7. [Kafka Issues](#kafka-issues)
8. [Database Issues](#database-issues)
9. [Network Issues](#network-issues)

## Setup Issues

### Issue: "bind source path does not exist: /tmp/logs"

**Symptoms:**

```
Error: invalid mount config for type "bind": bind source path does not exist: /tmp/logs
```

**Solution:**

```bash
# Create the logs directory
sudo mkdir -p /tmp/logs/
sudo chmod 777 /tmp/logs/
```

**Prevention:**
Create the directory before running `./instant-linux package init`.

### Issue: Docker Swarm Not Initialized

**Symptoms:**

```
Error: This node is not a swarm manager
```

**Solution:**

```bash
# Initialize Docker Swarm
docker swarm init

# If you have multiple network interfaces
docker swarm init --advertise-addr <your-ip-address>
```

### Issue: Port Already in Use

**Symptoms:**

```
Error: bind: address already in use
```

**Solution:**

```bash
# Find process using the port
sudo lsof -i :9000
# or
sudo netstat -tulpn | grep 9000

# Kill the process or change port in configuration
sudo kill -9 <PID>
```

**Alternative:**
Change the port in the service configuration or environment file.

### Issue: Insufficient Disk Space

**Symptoms:**

```
Error: no space left on device
```

**Solution:**

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Remove unused images
docker image prune -a

# Remove unused volumes (careful!)
docker volume prune
```

### Issue: Build Fails During Image Building

**Symptoms:**

```
Error: failed to build image
```

**Solution:**

```bash
# Check Docker daemon is running
sudo systemctl status docker

# Check available disk space
df -h

# Try building with no cache
docker build --no-cache -t <image-name> .

# Check build logs for specific errors
docker build -t <image-name> . 2>&1 | tee build.log
```

## Service Startup Issues

### Issue: Service Won't Start

**Symptoms:**

- Service shows `0/1` replicas
- Service keeps restarting

**Diagnosis:**

```bash
# Check service status
docker service ps <service-name> --no-trunc

# Check service logs
docker service logs <service-name> --tail 100

# Check for errors
docker service logs <service-name> 2>&1 | grep -i error
```

**Common Causes & Solutions:**

1. **Missing Dependencies:**

   ```bash
   # Ensure dependent services are running
   docker service ls

   # Start dependencies first
   docker service update --replicas 1 <dependency-service>
   ```

2. **Configuration Errors:**

   ```bash
   # Check environment variables
   docker service inspect <service-name> | grep -A 20 Env

   # Verify configuration files
   cat packages/<package>/package-metadata.json
   ```

3. **Resource Constraints:**

   ```bash
   # Check system resources
   docker stats

   # Increase resource limits in docker-compose.yml
   # Or reduce resource usage of other services
   ```

### Issue: Service Keeps Restarting

**Symptoms:**

- Service status shows restarting repeatedly
- High restart count

**Diagnosis:**

```bash
# Check restart count
docker service ps <service-name>

# Check logs for crash reasons
docker service logs <service-name> --tail 200
```

**Common Causes & Solutions:**

1. **Out of Memory (Exit Code 137):**

   ```bash
   # Increase memory allocation
   # Edit docker-compose.yml:
   deploy:
     resources:
       limits:
         memory: 4G  # Increase from current value
   ```

2. **Health Check Failing:**

   ```bash
   # Check health check configuration
   docker service inspect <service-name> | grep -A 10 HealthCheck

   # Temporarily disable health check to test
   docker service update --health-cmd=none <service-name>
   ```

3. **Database Connection Issues:**

   ```bash
   # Verify database is accessible
   docker service ps postgres

   # Check database connection string
   docker service inspect <service-name> | grep DB
   ```

### Issue: Service Not Accessible

**Symptoms:**

- Service is running but not responding
- Connection refused errors

**Diagnosis:**

```bash
# Check service is actually running
docker service ps <service-name>

# Check port mapping
docker service inspect <service-name> | grep -A 10 Ports

# Test connectivity
curl http://localhost:<port>
```

**Solutions:**

```bash
# Restart the service
docker service update --force <service-name>

# Check firewall rules
sudo ufw status
sudo iptables -L

# Verify service is listening
docker exec -it $(docker ps -q -f name=<service>) netstat -tulpn
```

## Connection Issues

### Issue: Cannot Connect to Database

**Symptoms:**

```
Error: connection refused
Error: authentication failed
```

**Diagnosis:**

```bash
# Check PostgreSQL is running
docker service ps postgres

# Check connection from service
docker exec -it $(docker ps -q -f name=<service>) \
  psql -h postgres -U <user> -d <database>

# Check database logs
docker service logs postgres --tail 50
```

**Solutions:**

```bash
# Verify database credentials
# Check .env.local or environment file
grep POSTGRES .env.local

# Restart database
docker service update --force postgres

# Wait for database to be ready
sleep 10

# Restart dependent service
docker service update --force <service-name>
```

### Issue: Cannot Connect to Kafka

**Symptoms:**

```
Error: broker not available
Error: connection timeout
```

**Diagnosis:**

```bash
# Check Kafka is running
docker service ps kafka

# Check Kafka brokers
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Check Kafka logs
docker service logs kafka --tail 50
```

**Solutions:**

```bash
# Restart Kafka
docker service update --force kafka

# Verify broker addresses in configuration
# Check SHR_TASK_RUNNER_BROKERS environment variable

# Check network connectivity
docker exec -it $(docker ps -q -f name=shr-mediator) \
  ping kafka-01
```

### Issue: Cannot Connect to External Services

**Symptoms:**

- Timeout errors
- Connection refused

**Diagnosis:**

```bash
# Test connectivity from container
docker exec -it $(docker ps -q -f name=<service>) \
  curl -v <external-url>

# Check DNS resolution
docker exec -it $(docker ps -q -f name=<service>) \
  nslookup <hostname>
```

**Solutions:**

```bash
# Add to /etc/hosts if needed
# For Kafka alias
echo "0.0.0.0 kafka-01" | sudo tee -a /etc/hosts

# Check firewall rules
sudo ufw status

# Verify service URLs in configuration
grep -r "http://" packages/<package>/config/
```

## Performance Issues

### Issue: Slow Response Times

**Symptoms:**

- High latency
- Timeout errors
- Slow API responses

**Diagnosis:**

```bash
# Check resource usage
docker stats

# Check service resource limits
docker service inspect <service-name> | grep -A 10 Resources

# Check database performance
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "SELECT * FROM pg_stat_activity;"
```

**Solutions:**

```bash
# Scale service horizontally
docker service scale <service-name>=3

# Increase resource allocation
# Edit docker-compose.yml resources section

# Optimize database queries
# Add indexes, optimize queries

# Check for connection pool exhaustion
# Increase pool size in configuration
```

### Issue: High Memory Usage

**Symptoms:**

- Services being killed (OOM)
- Exit code 137
- System running out of memory

**Diagnosis:**

```bash
# Check memory usage
docker stats

# Check service memory limits
docker service inspect <service-name> | grep Memory

# Check system memory
free -h
```

**Solutions:**

```bash
# Increase memory limits
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 4G  # Increase appropriately

# Reduce memory usage of other services
# Optimize application memory usage

# Add swap space (temporary solution)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Issue: High CPU Usage

**Symptoms:**

- Slow system response
- High CPU utilization

**Diagnosis:**

```bash
# Check CPU usage
docker stats

# Check specific service
docker service ps <service-name> --no-trunc
```

**Solutions:**

```bash
# Scale service to distribute load
docker service scale <service-name>=3

# Increase CPU limits
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '4'  # Increase appropriately

# Optimize application code
# Check for infinite loops or inefficient algorithms
```

## Data Issues

### Issue: Data Not Persisting

**Symptoms:**

- Data lost after restart
- Empty database

**Diagnosis:**

```bash
# Check volume mounts
docker service inspect <service-name> | grep -A 10 Mounts

# Check volume exists
docker volume ls

# Check database data
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "\dt"
```

**Solutions:**

```bash
# Ensure volumes are properly configured
# Check docker-compose.yml for volume definitions

# Use named volumes instead of bind mounts for persistence
volumes:
  - postgres_data:/var/lib/postgresql/data

# Verify volume permissions
docker volume inspect <volume-name>
```

### Issue: Data Sync Issues

**Symptoms:**

- Data out of sync between services
- Missing updates

**Diagnosis:**

```bash
# Check Kafka consumer lag
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group shr-consumer-group

# Check service logs for errors
docker service logs shr-mediator --tail 100 | grep -i error
```

**Solutions:**

```bash
# Restart consumers to catch up
docker service update --force shr-mediator

# Check for dead message queue
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic dmq --from-beginning

# Verify message processing
# Check service logs for processing errors
```

## Authentication Issues

### Issue: Cannot Login to Keycloak

**Symptoms:**

- Login fails
- Invalid credentials error

**Solution:**

```bash
# Verify credentials in .env.local
grep KEYCLOAK .env.local

# Default dev credentials:
# Username: admin
# Password: dev_password_only

# Reset admin password if needed
docker exec -it $(docker ps -q -f name=keycloak) \
  /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:9088 \
  --realm master \
  --user admin \
  --password <current-password>
```

### Issue: OpenHIM Authentication Fails

**Symptoms:**

- Cannot authenticate with OpenHIM
- 401 Unauthorized errors

**Solution:**

```bash
# Verify credentials
# Default: root@openhim.org / instant101

# Check OpenHIM logs
docker service logs openhim-core --tail 50 | grep -i auth

# Verify Keycloak integration
# Check OpenHIM configuration
docker service inspect openhim-core | grep -A 10 Env
```

### Issue: Service-to-Service Authentication Fails

**Symptoms:**

- Inter-service communication fails
- Authentication errors in logs

**Solution:**

```bash
# Verify service credentials in environment
docker service inspect <service-name> | grep -A 20 Env

# Check OpenHIM mediator registration
# Access OpenHIM console and verify mediators are registered

# Verify API keys/tokens
# Check service configuration for correct credentials
```

## Kafka Issues

### Issue: Kafka Topics Not Created

**Symptoms:**

- Topics missing
- Consumer cannot find topics

**Solution:**

```bash
# List existing topics
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 --list

# Create topics manually
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic send-adt-to-ipms --partitions 3 --replication-factor 1

# Repeat for other topics:
# - send-orm-to-ipms
# - save-pims-patient
# - save-ipms-patient
# - handle-oru-from-ipms
# - handle-adt-from-ipms
# - dmq
```

### Issue: High Kafka Consumer Lag

**Symptoms:**

- Messages piling up
- Slow processing

**Diagnosis:**

```bash
# Check consumer lag
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group shr-consumer-group
```

**Solution:**

```bash
# Scale consumers
docker service scale shr-mediator=3

# Increase partitions
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic <topic-name> --partitions 6

# Check for processing errors
docker service logs shr-mediator --tail 100 | grep -i error
```

### Issue: Messages in Dead Message Queue

**Symptoms:**

- Messages not being processed
- Messages in DMQ topic

**Diagnosis:**

```bash
# Check DMQ
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic dmq --from-beginning
```

**Solution:**

```bash
# Review messages to identify issues
# Check service logs for processing errors
docker service logs shr-mediator --tail 200 | grep -i error

# Fix underlying issue
# Reprocess messages if needed
```

## Database Issues

### Issue: PostgreSQL Connection Pool Exhausted

**Symptoms:**

```
Error: sorry, too many clients already
```

**Solution:**

```bash
# Check current connections
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "SELECT count(*) FROM pg_stat_activity;"

# Increase max_connections (if needed)
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "ALTER SYSTEM SET max_connections = 200;"

# Restart PostgreSQL
docker service update --force postgres

# Or reduce connection pool size in applications
```

### Issue: Database Corruption

**Symptoms:**

- Database errors
- Data inconsistencies

**Solution:**

```bash
# Check database integrity
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "SELECT * FROM pg_stat_database;"

# Run VACUUM
docker exec -it $(docker ps -q -f name=postgres) \
  psql -U hapi hapi -c "VACUUM FULL;"

# Restore from backup if needed
# See Operations Guide for backup/restore procedures
```

### Issue: Elasticsearch Cluster Health Issues

**Symptoms:**

- Yellow or red cluster status
- Index errors

**Diagnosis:**

```bash
# Check cluster health
curl -u elastic:dev_password_only http://localhost:9201/_cluster/health

# Check indices
curl -u elastic:dev_password_only http://localhost:9201/_cat/indices?v
```

**Solution:**

```bash
# If yellow (missing replicas), increase replicas or nodes
# If red (primary shards missing), restore from backup

# Check node status
curl -u elastic:dev_password_only http://localhost:9201/_nodes

# Restart Elasticsearch if needed
docker service update --force elasticsearch
```

## Network Issues

### Issue: Services Cannot Communicate

**Symptoms:**

- Connection refused
- Timeout errors

**Diagnosis:**

```bash
# Check services are on same network
docker network ls
docker network inspect <network-name>

# Test connectivity
docker exec -it $(docker ps -q -f name=<service1>) \
  ping <service2-name>
```

**Solution:**

```bash
# Verify service names match configuration
# Services communicate via Docker service names

# Check DNS resolution
docker exec -it $(docker ps -q -f name=<service>) \
  nslookup <target-service>

# Restart network if needed
docker network rm <network-name>
# Network will be recreated on next service update
```

### Issue: External Access Not Working

**Symptoms:**

- Cannot access services from outside
- Port not accessible

**Solution:**

```bash
# Check port mapping
docker service inspect <service-name> | grep -A 10 Ports

# Check firewall
sudo ufw status
sudo iptables -L

# Verify service is listening
docker exec -it $(docker ps -q -f name=<service>) \
  netstat -tulpn | grep <port>

# Check reverse proxy configuration (if using)
docker service logs reverse-proxy-nginx --tail 50
```

## Getting Additional Help

If you cannot resolve an issue:

1. **Check Logs:**

   ```bash
   docker service logs <service-name> --tail 200
   ```

2. **Review Documentation:**

   - [Setup Guide](../deployment/setup-guide.md)
   - [Configuration Guide](../configuration/configuration.md)
   - [Operations Guide](../sop/operations.md)

3. **Collect Information:**

   - Service status: `docker service ls`
   - Service details: `docker service inspect <service-name>`
   - System resources: `docker stats`
   - Logs: `docker service logs <service-name>`

4. **Search Issues:**
   - Check for similar issues in project repository
   - Review service-specific documentation

## Prevention Best Practices

1. **Regular Monitoring:**

   - Set up alerts in Grafana
   - Monitor service health regularly
   - Review logs proactively

2. **Resource Management:**

   - Monitor resource usage
   - Set appropriate limits
   - Plan for scaling

3. **Backup Strategy:**

   - Regular database backups
   - Configuration backups
   - Test restore procedures

4. **Documentation:**
   - Document custom configurations
   - Keep troubleshooting notes
   - Update runbooks
