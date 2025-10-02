# MFL Synchronization

This document describes the MFL (Master Facility List) synchronization functionality for the Facility Registry MFL project.

## Overview

The MFL synchronization system automatically fetches and updates facility data from the Botswana MFL API at [https://mfldit.gov.org.bw/api/v1/mfl/fhir](https://mfldit.gov.org.bw/api/v1/mfl/fhir) and keeps your local data files synchronized.

## Features

- **Automatic Data Fetching**: Retrieves locations and organizations from MFL API
- **Smart Comparison**: Identifies new, updated, and unchanged records
- **Incremental Updates**: Only processes changed data to minimize overhead
- **Error Handling**: Robust error handling with detailed logging
- **Multiple Interfaces**: REST API endpoints and CLI tools
- **Statistics**: Detailed sync statistics and status reporting

## API Endpoints

### POST `/sync/trigger`

Manually triggers synchronization with MFL API.

**Response:**

```json
{
  "success": true,
  "message": "Sync completed successfully. Added 15 new locations and 3 new organizations.",
  "statistics": {
    "totalMFL": 1250,
    "totalLocal": 1232,
    "newLocations": 15,
    "newOrganizations": 3,
    "updatedLocations": 5,
    "updatedOrganizations": 2,
    "errors": []
  }
}
```

### GET `/sync/status`

Gets current synchronization status and statistics.

**Response:**

```json
{
  "lastSync": "2024-01-15T10:30:00.000Z",
  "localCounts": {
    "locations": 800,
    "organizations": 432
  },
  "mflCounts": {
    "locations": 850,
    "organizations": 450
  }
}
```

### GET `/sync/health`

Health check for sync functionality.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "mflApiAccessible": true
}
```

## CLI Usage

### Manual Sync

```bash
# Run sync manually
npm run sync:mfl

# Or directly with ts-node
npx ts-node scripts/sync-mfl.ts
```

### Example Output

```
🏥 MFL Facility Registry Sync Tool
==================================

📡 Starting synchronization with MFL API...
   API URL: https://mfldit.gov.org.bw/api/v1/mfl/fhir

📊 Current Status:
   Local Locations: 800
   Local Organizations: 432
   MFL Locations: 850
   MFL Organizations: 450

✅ Sync Results:
   Status: SUCCESS
   Message: Sync completed successfully. Added 15 new locations and 3 new organizations.

📈 Statistics:
   Total MFL Records: 1300
   Total Local Records: 1232
   New Locations: 15
   New Organizations: 3
   Updated Locations: 5
   Updated Organizations: 2

🎉 Sync completed!
```

## Data Structure

The sync system works with FHIR-compliant data structures:

### Location

```typescript
interface Location {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  status: string;
  name: string;
  description?: string;
  type?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  address?: {
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  // ... other fields
}
```

### Organization

```typescript
interface Organization {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  active: boolean;
  name: string;
  alias?: string[];
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  // ... other fields
}
```

## Configuration

The sync system uses the following configuration:

- **MFL API Base URL**: `https://mfldit.gov.org.bw/api/v1/mfl/fhir`
- **Data Files**:
  - `config/locations.json` - Local locations data
  - `config/organizations.json` - Local organizations data
- **Timeout**: 30 seconds for API requests
- **Max Redirects**: 5

## Error Handling

The sync system includes comprehensive error handling:

- **Network Errors**: Retries and graceful degradation
- **Data Validation**: Validates FHIR structure before processing
- **File System Errors**: Handles file read/write errors
- **API Errors**: Handles HTTP errors and timeouts

## Logging

All sync operations are logged with appropriate levels:

- **INFO**: Normal operations and statistics
- **WARN**: Non-critical issues (e.g., API temporarily unavailable)
- **ERROR**: Critical errors that prevent sync completion

## Scheduling

For automated synchronization, you can:

1. **Use cron jobs** to run the CLI script periodically
2. **Use the REST API** with external schedulers
3. **Integrate with your CI/CD pipeline**

### Example Cron Job

```bash
# Run sync every 6 hours
0 */6 * * * cd /path/to/facility-registry-mfl && npm run sync:mfl
```

## Monitoring

Monitor sync operations using:

- **Health Check Endpoint**: `/sync/health`
- **Status Endpoint**: `/sync/status`
- **Application Logs**: Check for sync-related log entries
- **File Timestamps**: Monitor when data files were last updated

## Troubleshooting

### Common Issues

1. **API Timeout**: Increase timeout in sync service configuration
2. **Network Issues**: Check connectivity to MFL API
3. **File Permissions**: Ensure write permissions for data directory
4. **Memory Issues**: Large datasets may require more memory

### Debug Mode

Enable debug logging by setting the log level to debug in your NestJS configuration.

## Security Considerations

- **API Access**: MFL API is publicly accessible, no authentication required
- **Data Privacy**: Ensure compliance with data protection regulations
- **File Security**: Secure access to local data files
- **Network Security**: Use HTTPS for all API communications

## Performance

- **Incremental Updates**: Only processes changed data
- **Memory Efficient**: Processes data in chunks for large datasets
- **Concurrent Processing**: Uses async/await for optimal performance
- **Caching**: Local data is cached in memory for fast access

## Future Enhancements

- **Webhook Support**: Real-time updates from MFL API
- **Conflict Resolution**: Handle data conflicts intelligently
- **Backup/Restore**: Automatic backup before sync operations
- **Metrics Dashboard**: Web-based monitoring interface
