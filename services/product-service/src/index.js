const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3002;

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
  res.json({ status: 'alive', service: 'product-service' })
);

app.get('/health/ready', (req, res) =>
  res.json({ status: 'ready', service: 'product-service' })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/products', (req, res) =>
  res.json([{ id: 1, product: 'Laptop', price: 50000 }])
);

app.post('/products', (req, res) =>
  res.status(201).json({ id: 2, ...req.body })
);

app.get('/products/:id', (req, res) =>
  res.json({ id: req.params.id, product: 'Laptop' })
);

app.listen(PORT, () =>
  console.log(`product-service running on port ${PORT}`)
);
