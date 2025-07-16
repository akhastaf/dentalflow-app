# Monitoring Setup for DentistFlow

This directory contains the monitoring configuration for your DentistFlow application using Prometheus and Grafana.

## Overview

The monitoring stack includes:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics
- **PostgreSQL Exporter**: Database metrics
- **Application Metrics**: Custom metrics from your NestJS application

## Services

### Ports
- **API**: `http://localhost:3000`
- **Grafana**: `http://localhost:3001` (admin/admin123)
- **Prometheus**: `http://localhost:9090`
- **PostgreSQL**: `localhost:5432`
- **MinIO**: `http://localhost:9000` (console: `http://localhost:9001`)
- **Adminer**: `http://localhost:8080`

## Setup Instructions

### 1. Install Dependencies

First, install the required packages for your NestJS application:

```bash
cd app-back
npm install prom-client @nestjs/prometheus @willsoto/nestjs-prometheus
```

### 2. Update Your App Module

Add the monitoring module to your `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MonitoringModule } from './monitoring/prometheus.module';

@Module({
  imports: [
    // ... your existing imports
    MonitoringModule,
  ],
  // ... rest of your module configuration
})
export class AppModule {}
```

### 3. Add Middleware

Update your `src/main.ts` to include the metrics middleware:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MetricsMiddleware } from './monitoring/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add metrics middleware
  app.use(new MetricsMiddleware());
  
  // ... rest of your configuration
  
  await app.listen(3000);
}
bootstrap();
```

### 4. Start the Monitoring Stack

```bash
# From the app-back directory
docker-compose up -d
```

### 5. Access Grafana

1. Open `http://localhost:3001`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. The Prometheus datasource should be automatically configured
4. The "DentistFlow Overview" dashboard should be available

## Metrics Available

### System Metrics (Node Exporter)
- CPU usage
- Memory usage
- Disk space
- Network I/O
- System load

### Database Metrics (PostgreSQL Exporter)
- Active connections
- Query performance
- Database size
- Transaction rates

### Application Metrics
- HTTP request rate
- Response times
- Error rates
- Custom business metrics

## Custom Metrics

You can add custom metrics to your application:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';

@Injectable()
export class YourService {
  constructor(
    @InjectMetric('appointments_created_total') private appointmentsCreated: Counter<string>,
    @InjectMetric('active_patients') private activePatients: Gauge<string>,
  ) {}

  async createAppointment() {
    // Increment counter
    this.appointmentsCreated.inc({ status: 'success' });
  }

  async updateActivePatients(count: number) {
    // Set gauge value
    this.activePatients.set({}, count);
  }
}
```

## Alerting (Optional)

To add alerting, you can:

1. Add Alertmanager to your docker-compose.yml
2. Create alert rules in Prometheus
3. Configure notification channels in Grafana

## Best Practices

1. **Metrics Naming**: Use descriptive names with units (e.g., `http_request_duration_seconds`)
2. **Labels**: Use labels to categorize metrics (e.g., by endpoint, status code)
3. **Cardinality**: Avoid high-cardinality labels that can cause performance issues
4. **Retention**: Configure appropriate retention periods for your metrics
5. **Security**: In production, secure your monitoring endpoints

## Troubleshooting

### Prometheus not scraping metrics
- Check if your application is exposing metrics at `/metrics`
- Verify the scrape configuration in `prometheus.yml`
- Check container networking

### Grafana can't connect to Prometheus
- Verify Prometheus is running on port 9090
- Check the datasource configuration
- Ensure containers can communicate

### Application metrics not showing
- Verify the metrics middleware is applied
- Check if the monitoring module is imported
- Ensure the `/metrics` endpoint is accessible

## Production Considerations

1. **Security**: Use authentication for Grafana and Prometheus
2. **Persistence**: Configure persistent volumes for data storage
3. **Backup**: Regular backups of Prometheus and Grafana data
4. **Scaling**: Consider using external storage for Prometheus in large deployments
5. **Monitoring**: Monitor your monitoring stack itself

## Useful Commands

```bash
# View logs
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Restart services
docker-compose restart prometheus grafana

# Scale services
docker-compose up -d --scale api=3

# Clean up
docker-compose down -v
``` 