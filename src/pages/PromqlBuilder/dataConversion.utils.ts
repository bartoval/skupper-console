import { formatByteRate, formatBytes } from '../../core/utils/formatBytes';
import { formatLatency } from '../../core/utils/formatLatency';
import { PrometheusMetric } from '../../types/Prometheus.interfaces';

/**
 * Converts Prometheus matrix data to chart-compatible format and fills missing samples
 */
export function convertPromQLToSkAxisXY(
  result: PrometheusMetric<'matrix'>[] = [],
  { start, end }: { start: number; end: number }
) {
  // Return empty array if no results
  if (!result || result.length === 0) {
    // Create single series with zero values
    const step = 1; // Default 1 second step
    const numSamples = Math.floor((end - start) / step);

    return [
      Array.from({ length: numSamples }, (_, i) => ({
        x: start + i * step,
        y: 0
      }))
    ];
  }

  return result.map((series) => {
    // If series has no values, fill with zeros
    if (!series.values || series.values.length === 0) {
      const step = 1; // Default 1 second step
      const numSamples = Math.floor((end - start) / step);

      return Array.from({ length: numSamples }, (_, i) => ({
        x: start + i * step,
        y: 0
      }));
    }

    // Map existing values to x,y format
    return series.values.map(([timestamp, value]) => ({
      x: timestamp,
      y: value
    }));
  });
}

export function extractMetricInfo(result: PrometheusMetric<'matrix'>[] = []) {
  return result.map((series) => {
    const metric = series.metric || {};
    const sourceSite = metric.source_site_name || '';
    const sourceProcess = metric.source_process_name || '';
    const destSite = metric.dest_site_name || '';
    const destProcess = metric.dest_process_name || '';

    const parts = [];
    if (sourceSite) {
      parts.push(`Source Site: ${sourceSite}`);
    }
    if (sourceProcess) {
      parts.push(`Source Process: ${sourceProcess}`);
    }
    if (destSite) {
      parts.push(`Dest Site: ${destSite}`);
    }
    if (destProcess) {
      parts.push(`Dest Process: ${destProcess}`);
    }

    return parts.length > 0 ? parts.join(' | ') : '';
  });
}

type FormatterType = 'bytes' | 'byteRate' | 'latency' | 'count';

function determineFormatter(query: string): FormatterType | null {
  const normalizedQuery = query.toLowerCase().trim();

  // Check if query contains metrics of different types
  const hasBytes = /bytes_total/.test(normalizedQuery);
  const hasRequests = /requests_total|connections_.*total/.test(normalizedQuery);
  const hasLatency = /latency/.test(normalizedQuery);

  // Count how many different metric types we have
  const metricTypeCount = [hasBytes, hasRequests, hasLatency].filter(Boolean).length;
  if (metricTypeCount > 1) {
    return null;
  }

  // If we have only one type, proceed with normal logic
  const hasRate = /rate|irate/.test(normalizedQuery);

  if (hasBytes) {
    return hasRate ? 'byteRate' : 'bytes';
  }

  if (hasLatency) {
    return 'latency';
  }

  return 'count';
}

export function formatY(value: number, query: string): string {
  const formatterType = determineFormatter(query);

  switch (formatterType) {
    case 'bytes':
      return formatBytes(value);
    case 'byteRate':
      return formatByteRate(value);
    case 'latency':
      return formatLatency(value);
    default:
      return Math.ceil(value).toString();
  }
}
