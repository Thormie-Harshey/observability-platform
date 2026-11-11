// Loaded before index.js, so OpenTelemetry can wrap the libraries
// (Express, fetch, pg, redis, pino) before the app starts using them.
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// Requests that are housekeeping, not customer traffic
const IGNORED_PATHS = ['/metrics', '/health'];

const sdk = new NodeSDK({
  // Where to send traces: read from OTEL_EXPORTER_OTLP_ENDPOINT
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // File reads add noise, not insight
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Do not trace Prometheus scrapes or health checks
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => IGNORED_PATHS.includes(req.url),
      },
    }),
  ],
});

sdk.start();
