import { initializeFaro, getWebInstrumentations, type TransportItem } from '@grafana/faro-web-sdk';
import { ReactIntegration } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export function initFaro() {
  const faroUrl = import.meta.env.VITE_FARO_URL;

  if (!faroUrl) {
    console.warn('Grafana Faro URL is not configured. Telemetry is disabled.');
    return null;
  }

  return initializeFaro({
    url: faroUrl,
    ignoreUrls: [faroUrl],
    app: {
      name: 'tsu-taskgraph-web',
      version: '1.0.0',
      environment: import.meta.env.MODE,
    },
    instrumentations: [
      ...getWebInstrumentations(),
      new ReactIntegration(),
      new TracingInstrumentation(),
    ],
    beforeSend: (item: TransportItem) => {
      const payloadStr = JSON.stringify(item.payload || {});
      if (payloadStr.includes(faroUrl)) {
        return null;
      }
      return item;
    },
  });
}