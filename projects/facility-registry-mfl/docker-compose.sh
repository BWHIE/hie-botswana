#!/bin/bash

# Docker Compose management script for Facility Registry MFL
# Usage: ./docker-compose.sh [dev|prod|local] [up|down|restart|logs|status]

ENVIRONMENT=${1:-local}
ACTION=${2:-up}

case $ENVIRONMENT in
    "dev")
        COMPOSE_FILE="docker-compose.dev.yml"
        echo "Using development environment: $COMPOSE_FILE"
        ;;
    "prod")
        COMPOSE_FILE="docker-compose.prod.yml"
        echo "Using production environment: $COMPOSE_FILE"
        ;;
    "local")
        COMPOSE_FILE="docker-compose.yml"
        echo "Using local environment: $COMPOSE_FILE"
        ;;
    *)
        echo "Invalid environment. Use: dev, prod, or local"
        exit 1
        ;;
esac

case $ACTION in
    "up")
        echo "Starting $ENVIRONMENT environment..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    "down")
        echo "Stopping $ENVIRONMENT environment..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "restart")
        echo "Restarting $ENVIRONMENT environment..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    "logs")
        echo "Showing logs for $ENVIRONMENT environment..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "status")
        echo "Status of $ENVIRONMENT environment..."
        docker-compose -f $COMPOSE_FILE ps
        ;;
    *)
        echo "Invalid action. Use: up, down, restart, logs, or status"
        exit 1
        ;;
esac
