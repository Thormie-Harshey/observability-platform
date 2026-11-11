// Speedometer (Prometheus metrics) and logbook (JSON request logs) for one service.
const client = require('prom-client');
const pinoHttp = require('pino-http');

function instrument(app) {
  // CPU, memory and event-loop numbers for this Node process
  client.collectDefaultMetrics();

  // One histogram gives all three RED numbers: count (rate), status (errors), duration
  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });

  // The page Prometheus reads
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  // One JSON log line per request, with a level based on the result
  app.use(pinoHttp({
    autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }));

  // Time every request and record it once the response is sent
  app.use((req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') return next();
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      // Route pattern (/products/:id), never the real URL (/products/42)
      const route = req.route ? req.baseUrl + req.route.path : req.baseUrl || 'unmatched';
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });
}

module.exports = { instrument };
