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
      try {
        if (item.type === 'log') {
          const msg = item.payload && (item.payload as Record<string, unknown>).message;
          if (typeof msg === 'string' && msg.includes(faroUrl)) {
            return null;
          }
        }
        if (item.type === 'exception') {
          const val = item.payload && (item.payload as Record<string, unknown>).value;
          if (typeof val === 'string' && val.includes(faroUrl)) {
            return null;
          }
        }
        if (item.type === 'event') {
          const name = item.payload && (item.payload as Record<string, unknown>).name;
          if (typeof name === 'string' && name.includes(faroUrl)) {
            return null;
          }
        }
        if (item.type === 'trace') {
          const spans = item.payload && (item.payload as Record<string, unknown>).spans;
          if (Array.isArray(spans)) {
            const hasFaroUrl = spans.some(span => {
              if (span && typeof span.name === 'string' && span.name.includes(faroUrl)) {
                return true;
              }
              if (span && span.attributes && typeof span.attributes === 'object') {
                return Object.values(span.attributes).some(val => typeof val === 'string' && val.includes(faroUrl));
              }
              return false;
            });
            if (hasFaroUrl) {
              return null;
            }
          }
        }
      } catch {
        return null;
      }
      return item;
    },
  });
}