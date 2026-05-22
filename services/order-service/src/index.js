const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3003;

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
  res.json({ status: 'alive', service: 'order-service' })
);

app.get('/health/ready', (req, res) =>
  res.json({ status: 'ready', service: 'order-service' })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/orders', (req, res) =>
  res.json([{ id: 1, item: 'Laptop', quantity: 1 }])
);

app.post('/orders', (req, res) =>
  res.status(201).json({ id: 2, ...req.body })
);

app.get('/orders/:id', (req, res) =>
  res.json({ id: req.params.id, status: 'Processing' })
);

app.listen(PORT, () =>
  console.log(`order-service running on port ${PORT}`)
);
