const express = require('express');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Prometheus metrics — every service exposes /metrics from Day 1
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// Health probes — required for K8s liveness + readiness (Days 3+)
app.get('/health/live',  (req, res) => res.json({ status: 'alive', service: 'user-service' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready', service: 'user-service' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Business endpoints
app.get('/users',       (req, res) => res.json([{ id: 1, name: 'Sai', email: 'sai@shopstream.dev' }]));
app.post('/users',      (req, res) => res.status(201).json({ id: 2, ...req.body }));
app.get('/users/:id',   (req, res) => res.json({ id: req.params.id, name: 'Sai' }));

app.use((req, res, next) => { httpRequests.inc({ method: req.method, route: req.path, status: res.statusCode }); next(); });

app.listen(PORT, () => console.log(`user-service running on port ${PORT}`));
