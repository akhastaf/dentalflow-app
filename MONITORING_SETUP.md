# 🚀 DentistFlow Monitoring Setup Guide

## Overview

This guide will help you set up a comprehensive monitoring stack for your DentistFlow application using Prometheus and Grafana. The monitoring solution includes:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards  
- **Node Exporter**: System metrics
- **PostgreSQL Exporter**: Database metrics
- **Application Metrics**: Custom NestJS metrics
- **Alertmanager**: Alert handling and notifications

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │    │   PostgreSQL    │    │     MinIO       │
│   (NestJS)      │    │   Database      │    │   Storage       │
│   Port: 3000    │    │   Port: 5432    │    │   Port: 9000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Prometheus    │
                    │   Port: 9090    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Grafana      │
                    │   Port: 3001    │
                    └─────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js and npm (for development)
- Basic understanding of Prometheus and Grafana

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd app-back
npm install prom-client @nestjs/prometheus @willsoto/nestjs-prometheus
```

### 2. Update Your Application

#### Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MonitoringModule } from './monitoring/prometheus.module';

@Module({
  imports: [
    // ... your existing imports
    MonitoringModule,
  ],
  // ... rest of your configuration
})
export class AppModule {}
```

#### Update `src/main.ts`:

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

### 3. Start Monitoring Stack

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## 📊 Available Metrics

### System Metrics (Node Exporter)
- CPU usage and load
- Memory usage
- Disk space and I/O
- Network traffic
- System uptime

### Database Metrics (PostgreSQL Exporter)
- Active connections
- Query performance
- Database size
- Transaction rates
- Lock statistics

### Application Metrics
- HTTP request rate
- Response times
- Error rates
- Custom business metrics

## 🎯 Custom Metrics Examples

### Business Metrics

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectMetric('appointments_created_total') private appointmentsCreated: Counter<string>,
    @InjectMetric('appointments_duration_seconds') private appointmentDuration: Histogram<string>,
    @InjectMetric('active_patients') private activePatients: Gauge<string>,
  ) {}

  async createAppointment(appointmentData: any) {
    const start = Date.now();
    
    try {
      // Your appointment creation logic
      const appointment = await this.appointmentRepository.create(appointmentData);
      
      // Increment counter
      this.appointmentsCreated.inc({ status: 'success', type: appointmentData.type });
      
      // Record duration
      const duration = (Date.now() - start) / 1000;
      this.appointmentDuration.observe({ type: appointmentData.type }, duration);
      
      return appointment;
    } catch (error) {
      this.appointmentsCreated.inc({ status: 'error', type: appointmentData.type });
      throw error;
    }
  }

  async updateActivePatientsCount() {
    const count = await this.patientRepository.countActive();
    this.activePatients.set({}, count);
  }
}
```

### Database Metrics

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectMetric('database_query_duration_seconds') private queryDuration: Histogram<string>,
  ) {}

  async executeQuery(query: string, params: any[]) {
    const start = Date.now();
    
    try {
      const result = await this.connection.query(query, params);
      
      const duration = (Date.now() - start) / 1000;
      this.queryDuration.observe({ query_type: 'select' }, duration);
      
      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      this.queryDuration.observe({ query_type: 'select', error: 'true' }, duration);
      throw error;
    }
  }
}
```

## 🔔 Alerting Setup

### Prometheus Alert Rules

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: dentistflow_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for 5 minutes"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 85% for 5 minutes"

      - alert: DatabaseConnectionHigh
        expr: pg_stat_database_numbackends > 50
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has more than 50 active connections"

      - alert: APIDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "The API service is not responding"
```

### Update Prometheus Configuration

Add to `monitoring/prometheus.yml`:

```yaml
rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

## 🛡️ Security Best Practices

### 1. Authentication

```bash
# Set secure passwords via environment variables
export GRAFANA_ADMIN_USER=admin
export GRAFANA_ADMIN_PASSWORD=your_secure_password
```

### 2. Network Security

```yaml
# In docker-compose.prod.yml
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 3. SSL/TLS

```nginx
# nginx.conf for SSL termination
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://api:3000;
    }
    
    location /grafana {
        proxy_pass http://grafana:3000;
    }
}
```

## 📈 Performance Optimization

### 1. Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

storage:
  tsdb:
    retention.time: 30d
    retention.size: 10GB
```

### 2. Grafana Configuration

```ini
[server]
http_port = 3000
root_url = http://localhost:3001

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[security]
admin_user = admin
admin_password = admin123
```

## 🔧 Troubleshooting

### Common Issues

1. **Prometheus can't scrape metrics**
   ```bash
   # Check if metrics endpoint is accessible
   curl http://localhost:3000/metrics
   
   # Check Prometheus targets
   http://localhost:9090/targets
   ```

2. **Grafana can't connect to Prometheus**
   ```bash
   # Check Prometheus is running
   docker-compose ps prometheus
   
   # Check network connectivity
   docker-compose exec grafana ping prometheus
   ```

3. **High memory usage**
   ```bash
   # Check Prometheus memory usage
   docker stats dentistFlow-prometheus
   
   # Adjust retention settings
   --storage.tsdb.retention.time=15d
   ```

### Useful Commands

```bash
# View logs
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Restart services
docker-compose restart prometheus grafana

# Check metrics endpoint
curl http://localhost:3000/metrics

# Backup Grafana dashboards
docker-compose exec grafana grafana-cli admin backup

# Scale services
docker-compose up -d --scale api=3
```

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [NestJS Prometheus Integration](https://github.com/willsoto/nestjs-prometheus)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## 🎯 Next Steps

1. **Custom Dashboards**: Create dashboards specific to your business metrics
2. **Alerting**: Configure Slack/email notifications for critical alerts
3. **Log Aggregation**: Add ELK stack or similar for log management
4. **Tracing**: Implement distributed tracing with Jaeger or Zipkin
5. **APM**: Consider adding Application Performance Monitoring tools

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f [service-name]`
2. Verify configuration files
3. Test individual components
4. Check network connectivity between containers

---

**Happy Monitoring! 🚀** 