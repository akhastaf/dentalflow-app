#!/bin/bash

echo "🚀 Setting up monitoring for DentistFlow..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the app-back directory"
    exit 1
fi

echo "📦 Installing monitoring dependencies..."
npm install prom-client @nestjs/prometheus @willsoto/nestjs-prometheus

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🐳 Starting monitoring stack..."
docker-compose up -d prometheus grafana node-exporter postgres-exporter

if [ $? -eq 0 ]; then
    echo "✅ Monitoring services started successfully"
else
    echo "❌ Failed to start monitoring services"
    exit 1
fi

echo ""
echo "🎉 Monitoring setup complete!"
echo ""
echo "📊 Access your monitoring dashboards:"
echo "   Grafana: http://localhost:3001 (admin/admin123)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "📋 Next steps:"
echo "   1. Update your src/app.module.ts to include MonitoringModule"
echo "   2. Update your src/main.ts to include MetricsMiddleware"
echo "   3. Restart your API service"
echo "   4. Access Grafana and explore the 'DentistFlow Overview' dashboard"
echo ""
echo "📚 For detailed instructions, see: monitoring/README.md" 