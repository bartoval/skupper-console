import { Labels } from '../../../config/labels';
import { ellipsisInTheMiddle } from '../../../core/utils/EllipsisInTheMiddle';
import { formatByteRate, formatBytes } from '../../../core/utils/formatBytes';
import { formatLatency } from '../../../core/utils/formatLatency';
import { MatrixMetric, PrometheusMetric, PrometheusResult } from '../../../types/Prometheus.interfaces';

/**
 * Converts Prometheus matrix data to chart-compatible format and fills missing samples
 */
export function convertPromQLToSkAxisXY(
  result: PrometheusMetric<'matrix'>[] = [],
  { interval, now = Date.now() / 1000 }: { interval: number; now?: number } // Default value for "now"
) {
  // Calculate start and end times
  const end = now;
  const start = now - interval;

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
    return series.values.map(([x, y]) => ({
      x: Number(x),
      y: isNaN(Number(y)) ? 0 : Number(y)
    }));
  });
}

function determineFormatter(query: string): 'bytes' | 'byteRate' | 'latency' | 'count' | null {
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

export function getChartTitle(query?: string): string {
  if (!query) {
    return '  ';
  }

  const formatterType = determineFormatter(query);

  switch (formatterType) {
    case 'bytes':
      return Labels.BytesTransferred;
    case 'byteRate':
      return Labels.BytesPerSeconds;
    case 'latency':
      return Labels.Latency;
    default:
      return '  ';
  }
}

export function formatY(value: number, query?: string): string {
  const formatterType = query ? determineFormatter(query) : '';

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

/**
 * Formats the metrics data and sorts it from highest to lowest value.
 */

export const includedFields = [
  'source_site_name',
  'source_process_name',
  'dest_site_name',
  'dest_process_name',
  'routing_key',
  'protocol',
  'source_component_name',
  'dest_component_name'
];

export function formatMetrics(data: MatrixMetric[] | undefined, format: (y: number) => string) {
  if (!data?.length) {
    return [];
  }

  // Create an array of objects containing the extracted value and the original item
  const metricsWithValue = data.map((item) => {
    let value: number = NaN;
    if (item.values?.length) {
      value = item.values[item.values.length - 1][1];
    }

    return { value, item };
  });

  // Now, format the sorted metrics
  const formattedMetrics = metricsWithValue.map(({ item }) => {
    const label = includedFields
      .map((field) =>
        item.metric[field]
          ? `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}: ${item.metric[field]}`
          : null
      )
      .filter(Boolean)
      .join(' | ');

    let value: number = NaN;
    if (item.values?.length) {
      value = item.values[item.values.length - 1][1];
    }

    return { label, value: format(value) };
  });

  return formattedMetrics;
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

    return parts.length > 0
      ? ellipsisInTheMiddle(parts.join(' | '), { maxLength: 30, leftPartLenth: 30, rightPartLength: 0 })
      : '';
  });
}

export const getMetricLabel = (metric: Record<string, string>): string =>
  includedFields
    .map((field) =>
      metric[field] ? `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}: ${metric[field]}` : null
    )
    .filter(Boolean)
    .join(' | ');

/**
 * Sorts an array of Prometheus results (matrix) based on the last value,
 * from largest to smallest. Filters out any vector types to maintain MatrixMetric[] output.
 * Removes series where all values are zero.
 */
export function sortPrometheusResults(
  data: PrometheusResult<'matrix' | 'vector'> | undefined
): MatrixMetric[] | undefined {
  if (!data) {
    return undefined;
  }

  // 1. Filter and type-assert to MatrixMetric[], removing zero-value series
  const matrixData: MatrixMetric[] = data.reduce<MatrixMetric[]>((acc, item) => {
    if ('values' in item && Array.isArray(item.values)) {
      // It's likely a MatrixMetric, but we need to be extra sure about the shape of 'values'
      if (
        item.values.every(
          (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            typeof value[0] === 'number' &&
            (typeof value[1] === 'string' || typeof value[1] === 'number')
        )
      ) {
        // Check if all values are zero
        const allValuesAreZero = item.values.every((value) => {
          const numValue = Number(value[1]);

          return Number.isNaN(numValue) || numValue === 0;
        });

        if (!allValuesAreZero) {
          acc.push(item as MatrixMetric); // Add it to the accumulator
        }
      }
    }

    return acc;
  }, []);

  // 2. Create a copy of the filtered array to avoid modifying the original
  const sortedData = [...matrixData];

  // 3. Sort based on the last value (largest to smallest)
  sortedData.sort((a, b) => {
    let aValue: number | typeof NaN = NaN;
    let bValue: number | typeof NaN = NaN;

    if (a.values && a.values.length > 0) {
      aValue = Number(a.values[a.values.length - 1][1]); // Convert to number
    }

    if (b.values && b.values.length > 0) {
      bValue = Number(b.values[b.values.length - 1][1]); // Convert to number
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return bValue - aValue;
    }

    return 0; // Handle cases where aValue or bValue are NaN
  });

  return sortedData;
}
