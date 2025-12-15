# Architecture Overview

This document provides a comprehensive overview of the Botswana HIE platform architecture, including system components, data flows, and integration patterns.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Core Components](#core-components)
4. [Data Flows](#data-flows)
5. [Integration Patterns](#integration-patterns)
6. [Deployment Architecture](#deployment-architecture)

## System Overview

The Botswana HIE is built on OpenHIE principles and provides a standards-based health information exchange platform. It facilitates secure, interoperable exchange of health information between various healthcare systems, registries, and services.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
│  (PIMS, OpenMRS, IPMS, National Registries, etc.)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Interoperability Layer (OpenHIM)               │
│  - Transaction Management                                    │
│  - Authentication & Authorization                           │
│  - Routing & Mediation                                      │
│  - Auditing & Logging                                       │
└──────────────┬───────────────────────┬───────────────────────┘
               │                       │
    ┌──────────▼──────────┐  ┌─────────▼──────────┐
    │   Mediators         │  │   Core Services    │
    │  - SHR Mediator     │  │  - Client Registry │
    │  - Omang Mediator   │  │  - FHIR Store      │
    │  - FHIR Converter   │  │  - Facility Reg    │
    └──────────┬──────────┘  └─────────┬──────────┘
               │                       │
    ┌──────────▼───────────────────────▼──────────┐
    │         Message Bus (Kafka)                  │
    │  - Asynchronous Processing                   │
    │  - Event Streaming                           │
    └──────────────────────────────────────────────┘
               │
    ┌──────────▼───────────────────────────────────┐
    │         Data Storage Layer                    │
    │  - PostgreSQL (Metadata)                     │
    │  - HAPI FHIR (Clinical Data)                 │
    │  - Elasticsearch (Analytics)                 │
    └───────────────────────────────────────────────┘
```

## Architecture Layers

### 1. Presentation Layer

**Components:**

- **Keycloak**: Identity and Access Management UI
- **OpenHIM Console**: Transaction monitoring and configuration
- **OpenCR UI**: Client Registry management
- **Grafana**: Monitoring dashboards
- **Kibana**: Log analysis and visualization
- **Kafdrop**: Kafka topic management

**Responsibilities:**

- User authentication and authorization
- System monitoring and visualization
- Configuration management
- Log analysis

### 2. Interoperability Layer

**Components:**

- **OpenHIM Core**: Central transaction manager
- **Reverse Proxy (Nginx)**: Load balancing and SSL termination

**Responsibilities:**

- Transaction routing and orchestration
- Authentication and authorization
- Request/response transformation
- Audit logging
- Rate limiting and throttling

### 3. Mediation Layer

**Components:**

- **SHR Mediator**: Shared Health Record management
- **Omang Service Mediator**: National registry integration
- **FHIR Converter Mediator**: HL7 V2 ↔ FHIR transformation
- **Facility Registry MFL**: Master Facility List service

**Responsibilities:**

- Protocol translation (HL7 V2, FHIR)
- Data transformation and enrichment
- Business logic execution
- External system integration

### 4. Messaging Layer

**Components:**

- **Apache Kafka**: Message broker
- **Kafka Topics**: Event streams

**Key Topics:**

- `send-adt-to-ipms`: Patient registration to IPMS
- `send-orm-to-ipms`: Lab orders to IPMS
- `save-pims-patient`: Patient data from PIMS
- `save-ipms-patient`: Patient data from IPMS
- `handle-oru-from-ipms`: Lab results from IPMS
- `handle-adt-from-ipms`: Patient updates from IPMS
- `dmq`: Dead message queue for failed messages

**Responsibilities:**

- Asynchronous message processing
- Event streaming
- Decoupling of services
- Message persistence

### 5. Data Storage Layer

**Components:**

- **PostgreSQL**: Metadata and configuration storage
- **HAPI FHIR**: Clinical data storage (FHIR resources)
- **Elasticsearch**: Analytics and search
- **Oracle Database**: External registry data (Omang, BDRS, Immigration)

**Responsibilities:**

- Persistent data storage
- Data indexing and search
- Analytics and reporting
- Data backup and recovery

### 6. Infrastructure Layer

**Components:**

- **Docker Swarm**: Container orchestration
- **Monitoring Stack**: Prometheus, Grafana, Loki, Promtail
- **Logging**: Centralized log aggregation

**Responsibilities:**

- Service deployment and scaling
- Health monitoring
- Log aggregation
- Resource management

## Core Components

### 1. OpenHIM (Open Health Information Mediator)

**Purpose**: Central interoperability layer for transaction management

**Key Features:**

- Transaction routing and orchestration
- Authentication and authorization
- Request/response transformation
- Comprehensive audit logging
- Channel and route configuration

**Ports:**

- HTTP: 9000
- HTTPS: 5001

**Configuration:**

- Admin credentials: `root@openhim.org` / `instant101`
- Mediator registration via URN
- Channel-based routing

### 2. Shared Health Record (SHR) Mediator

**Purpose**: Centralized persistence and management of longitudinal patient health data

**Key Features:**

- FHIR resource storage and retrieval
- Lab workflow management
- HL7 MLLP communication with IPMS
- Kafka-based asynchronous processing
- Concept and location mapping via OCL

**Ports:**

- HTTP API: 3000
- MLLP Interceptor: 3001
- MLLP ORU: 3002

**Dependencies:**

- HAPI FHIR Server
- Kafka
- OpenHIM
- OpenCR
- FHIR Converter Mediator
- OCL (OpenConceptLab)

### 3. Omang Service Mediator

**Purpose**: Integration with national registries (Omang, BDRS, Immigration)

**Key Features:**

- RESTful API for registry queries
- FHIR Patient resource transformation
- Oracle database connectivity
- Demographic search capabilities

**Ports:**

- HTTP API: 3004

**Data Sources:**

- Omang Registry (Oracle)
- BDRS Registry (Oracle)
- Immigration Registry (Oracle)

**API Endpoints:**

- `GET /api/patient/Get` - Search patients by identifier or demographics

### 4. Client Registry (OpenCR)

**Purpose**: Master patient index and identity management

**Key Features:**

- Patient identity resolution
- Duplicate detection and merging
- Cross-system identifier management
- FHIR Patient resource management

**Ports:**

- HTTP UI: 3003

**Configuration:**

- Decision rules for identity matching
- Patient relationship management

### 5. FHIR Datastore (HAPI FHIR)

**Purpose**: FHIR-compliant clinical data storage

**Key Features:**

- FHIR R4 compliant server
- RESTful API
- Resource validation
- Implementation Guide support
- Search capabilities

**Ports:**

- HTTP: 3447

**Storage:**

- PostgreSQL backend
- Resource versioning
- Transaction support

### 6. Facility Registry MFL

**Purpose**: Master Facility List service and fallback

**Key Features:**

- Location and Organization APIs
- MFL synchronization
- FHIR-compliant resources
- Search and filtering

**Ports:**

- HTTP API: 3005

**Data Sources:**

- Botswana MFL API: https://mfldit.gov.org.bw/api/v1/mfl/fhir
- Local JSON data files

### 7. FHIR Converter Mediator

**Purpose**: HL7 V2 ↔ FHIR transformation

**Key Features:**

- HL7 V2 message parsing
- FHIR resource generation
- Template-based transformation
- Bidirectional conversion

**Ports:**

- HTTP API: 2019

**Templates:**

- ADT messages
- ORM messages
- ORU messages

### 8. Analytics Datastore (Elasticsearch)

**Purpose**: Analytics, search, and reporting

**Key Features:**

- Full-text search
- Analytics and aggregations
- Log storage
- Dashboard data source

**Ports:**

- HTTP: 9201

**Integration:**

- Kibana for visualization
- Log aggregation from services

### 9. Message Bus (Kafka)

**Purpose**: Asynchronous message processing and event streaming

**Key Features:**

- Topic-based messaging
- Message persistence
- Consumer groups
- Dead letter queue

**Ports:**

- Broker: 9092
- Kafdrop UI: 9013

**Topics:**

- Lab workflow topics
- Patient synchronization topics
- Dead message queue

## Data Flows

### Lab Workflow Flow

```
1. PIMS/OpenMRS → OpenHIM → SHR Mediator
   POST /SHR/lab (FHIR Bundle)

2. SHR Mediator:
   - Saves bundle to HAPI FHIR
   - Produces message to "send-adt-to-ipms" topic

3. Kafka Consumer (SHR):
   - Consumes "send-adt-to-ipms" message
   - Enriches bundle (concept mapping, location mapping)
   - Produces to "save-pims-patient" topic
   - Sends ADT^A04 to IPMS via MLLP
   - Saves enriched bundle to HAPI FHIR

4. IPMS → MLLP Interceptor (SHR):
   - Receives ADT^A04 with MRN
   - Produces to "handle-adt-from-ipms" topic

5. Kafka Consumer (SHR):
   - Consumes "handle-adt-from-ipms" message
   - Translates HL7 to FHIR via FHIR Converter
   - Produces to "save-ipms-patient" topic
   - Sends ORM^O01 to IPMS
   - Updates Task status to "in-progress"

6. IPMS → MLLP Interceptor (SHR):
   - Receives ORU^R01 (lab results)
   - Produces to "handle-oru-from-ipms" topic

7. Kafka Consumer (SHR):
   - Consumes "handle-oru-from-ipms" message
   - Translates HL7 to FHIR
   - Updates DiagnosticReport and Observations
   - Saves to HAPI FHIR
```

### Patient Registration Flow

```
1. External System → OpenHIM → Omang Service Mediator
   GET /api/patient/Get?identifier=omang|123456789

2. Omang Service Mediator:
   - Queries Oracle database
   - Transforms to FHIR Patient
   - Returns Bundle

3. External System → OpenHIM → SHR Mediator
   POST /SHR/patient (FHIR Patient)

4. SHR Mediator:
   - Saves to HAPI FHIR
   - Produces to "save-pims-patient" topic

5. Kafka Consumer:
   - Consumes patient message
   - Sends to OpenCR for identity resolution
   - Updates patient identifiers
```

### Facility Lookup Flow

```
1. External System → OpenHIM → Facility Registry MFL
   GET /api/v1/location/search?name=Gaborone

2. Facility Registry MFL:
   - Searches local JSON data
   - Returns FHIR Location resources

3. If MFL API accessible:
   - Syncs with MFL API
   - Updates local data files
```

## Integration Patterns

### 1. HL7 MLLP Integration

**Use Case**: Communication with IPMS (Integrated Patient Management System)

**Protocol**: HL7 V2 over MLLP (Minimum Lower Layer Protocol)

**Message Types:**

- ADT^A04: Patient registration/update
- ORM^O01: Lab order
- ORU^R01: Lab result

**Flow:**

```
SHR Mediator → MLLP Client → IPMS MLLP Server
IPMS MLLP Server → MLLP Interceptor → SHR Mediator
```

### 2. FHIR REST Integration

**Use Case**: Standard FHIR-based communication

**Protocol**: HTTP/HTTPS with FHIR R4

**Resources:**

- Patient
- ServiceRequest
- DiagnosticReport
- Observation
- Location
- Organization

**Endpoints:**

- HAPI FHIR: `http://localhost:3447/fhir`
- SHR Mediator: `http://localhost:3000`
- Facility Registry: `http://localhost:3005/api/v1`

### 3. Kafka Event-Driven Integration

**Use Case**: Asynchronous processing and service decoupling

**Pattern**: Producer-Consumer with topics

**Benefits:**

- Decoupled services
- Scalability
- Fault tolerance
- Event replay capability

### 4. Database Integration

**Use Case**: Direct database access for registries

**Databases:**

- PostgreSQL: Metadata and FHIR storage
- Oracle: National registries (Omang, BDRS, Immigration)
- Elasticsearch: Analytics and search

**Connection Patterns:**

- Connection pooling
- Read replicas for analytics
- Transaction management

## Deployment Architecture

### Docker Swarm Deployment

```
┌─────────────────────────────────────────────────┐
│            Swarm Manager Node                   │
│  - OpenHIM Core                                 │
│  - Keycloak                                     │
│  - PostgreSQL                                   │
│  - Monitoring Services                          │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼───┐ ┌─────▼─────┐ ┌───▼──────┐
│  Worker   │ │  Worker   │ │  Worker  │
│  Node 1   │ │  Node 2   │ │  Node 3  │
│           │ │           │ │          │
│ - SHR     │ │ - Omang   │ │ - Kafka  │
│ - FHIR    │ │ - MFL     │ │ - ES     │
│ - Meds    │ │ - Convert │ │ - Kibana │
└───────────┘ └───────────┘ └──────────┘
```

### Service Distribution

**Manager Node:**

- Control plane services
- Configuration services
- Monitoring services

**Worker Nodes:**

- Application services
- Data processing services
- Analytics services

### Scaling Strategy

**Horizontal Scaling:**

- Replicate stateless services
- Use load balancers
- Distribute across nodes

**Vertical Scaling:**

- Increase resources for data-intensive services
- Optimize resource allocations
- Monitor resource usage

### High Availability

**Strategies:**

- Multiple manager nodes (quorum)
- Service replication
- Health checks and auto-restart
- Data backups
- Network redundancy

## Security Architecture

### Authentication & Authorization

**Components:**

- Keycloak: Identity provider
- OpenHIM: Transaction-level auth
- Service-level authentication

**Flows:**

- OAuth 2.0 / OpenID Connect
- Certificate-based authentication
- API key authentication

### Data Security

**Encryption:**

- TLS/SSL for data in transit
- Database encryption at rest
- Secure key management

**Access Control:**

- Role-based access control (RBAC)
- Resource-level permissions
- Audit logging

## Monitoring & Observability

### Monitoring Stack

**Components:**

- Prometheus: Metrics collection
- Grafana: Visualization
- Loki: Log aggregation
- Promtail: Log shipping

### Key Metrics

- Service health and availability
- Transaction throughput
- Response times
- Error rates
- Resource utilization
- Kafka topic lag

### Dashboards

- Docker Swarm monitoring
- OpenHIM transactions
- Kafka topics and consumers
- Application performance
- Infrastructure metrics

## Next Steps

- Review [Configuration Guide](../configuration/configuration.md) for component configuration
- Read [Operations Guide](../sop/operations.md) for operational procedures
- Consult [Development Guide](../development/development.md) for development workflows
