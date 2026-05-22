const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3004;

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
  res.json({ status: 'alive', service: 'notification-service' })
);

app.get('/health/ready', (req, res) =>
  res.json({ status: 'ready', service: 'notification-service' })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/notify', (req, res) =>
  res.status(200).json({
    message: 'Notification sent',
    payload: req.body
  })
);

app.get('/notifications', (req, res) =>
  res.json([{ id: 1, type: 'email', status: 'sent' }])
);

app.listen(PORT, () =>
  console.log(`notification-service running on port ${PORT}`)
);
