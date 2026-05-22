const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequests.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

app.get('/health/live', (req, res) =>
  res.json({ status: 'alive', service: 'analytics-service' })
);

app.get('/health/ready', (req, res) =>
  res.json({ status: 'ready', service: 'analytics-service' })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/metrics/orders', (req, res) =>
  res.json({ totalOrders: 1200 })
);

app.get('/metrics/revenue', (req, res) =>
  res.json({ revenue: 500000 })
);

app.listen(PORT, () =>
  console.log(`analytics-service running on port ${PORT}`)
);
