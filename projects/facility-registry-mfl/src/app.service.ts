import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      service: 'Facility Registry MFL API',
      version: '1.0.0',
      description: 'REST API for accessing organizations and locations data',
      endpoints: {
        locations: '/api/v1/locations',
        organizations: '/api/v1/organizations',
        health: '/api/v1/health'
      },
      timestamp: new Date().toISOString()
    };
  }

  getHealth(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
