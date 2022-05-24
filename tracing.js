// tracing.js

const process = require('process');
const { Metadata, credentials } = require('@grpc/grpc-js');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  AwsInstrumentation,
} = require("@opentelemetry/instrumentation-aws-sdk");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { ConsoleSpanExporter, NoopSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const metadata = new Metadata();

// The Trace Exporter exports the data to Honeycomb and uses
// the previously-configured metadata and the Honeycomb endpoint.
let traceExporter;
if ('OTEL_CONSOLE_TRACING' in process.env && process.env.OTEL_CONSOLE_TRACING.toLowerCase() !== 'false') {
  console.log('writing tracing data to ConsoleSpanExporter');
  traceExporter = new ConsoleSpanExporter();
} else {
  console.log('writing tracing data to NoopSpanProcessor');
  traceExporter = new NoopSpanProcessor();
}

// The service name is REQUIRED! It is a resource attribute,
// which means that it will be present on all observability data that your service generates.
//
// Your service name will be used as the Service Dataset in Honeycomb, which is where data is stored.
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'Unknown',
  }),
  traceExporter,
});

registerInstrumentations({
  instrumentations: [
    new AwsInstrumentation({
      // see under for available configuration
    }),
  ],
});

sdk
  .start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.error('Error initializing tracing', error));

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0)); // eslint-disable-line
}); // eslint-disable-line
