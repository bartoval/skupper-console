import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Checks if the query contains at least one valid metric name from the Prometheus dictionary.
 *
 * Improvement Suggestion: This function currently only checks for the presence of a metric.
 * It might be useful to check if metrics are used in valid contexts.
 */
export const hasValidMetricNames = (query: string): { isValid: boolean; position?: number } => {
  for (const metric of PROMETHEUS_DICTIONARY.metrics) {
    const position = query.indexOf(metric);
    if (position !== -1) {
      return { isValid: true };
    }
  }

  return { isValid: false, position: 0 };
};
