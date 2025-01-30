import { PromqlBuilderRoutesPaths } from './PromqlBuilder.enum';
import { Labels } from '../../config/labels';
import { QueryTemplate } from '../../types/PromBuilder.interfaces';

export const PromqlBuilderPaths = {
  path: PromqlBuilderRoutesPaths.PromqlBuilder,
  name: Labels.PromqlBuilder
};

export const LANGUAGE_ID = 'promql';

export const TOKEN_TYPES = {
  AGGREGATOR: 'aggregator',
  FUNCTION: 'function',
  KEYWORD: 'keyword',
  METRIC: 'metric',
  LABEL: 'label',
  NUMBER: 'number',
  STRING: 'string',
  OPERATOR: 'operator',
  DELIMITER: 'delimiter',
  IDENTIFIER: 'identifier'
} as const;

export const TIME_UNITS = [
  { value: 's', description: 'seconds' },
  { value: 'm', description: 'minutes' },
  { value: 'h', description: 'hours' },
  { value: 'd', description: 'days' },
  { value: 'w', description: 'weeks' },
  { value: 'y', description: 'years' }
];

export const PROMETHEUS_TEMPLATES: Record<string, QueryTemplate> = {
  sumByteRate: {
    template: 'sum by(${groupBy})(rate(${metric}${params}[30s]))',
    description: 'Calculates the rate with grouping',
    params: [
      { name: 'groupBy', type: 'label_name', default: 'label_name' },
      { name: 'metric', type: 'bytes_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', optional: true, default: '{}' }
    ]
  },
  histogramQuantile: {
    template: 'histogram_quantile(${quantile}, sum(increase(${metric}${params}[${range}]))by(le))',
    description: 'Calculates the percentile from histogram buckets',
    params: [
      { name: 'quantile', type: 'number', default: '0.95' },
      { name: 'metric', type: 'histogram_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' },
      { name: 'range', type: 'time_range', default: '1m' }
    ]
  },
  openConnections: {
    template: 'sum(${openMetric}${params}-${closeMetric}${params})',
    description: 'Calculates open connections',
    params: [
      { name: 'openMetric', type: 'connection_metric', default: 'open_metric_name' },
      { name: 'closeMetric', type: 'connection_metric', default: 'close_metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' }
    ]
  },
  requestRateByMethod: {
    template: 'sum by(method)(rate(${metric}${params}[${range}]))',
    description: 'Request rate grouped by method',
    params: [
      { name: 'metric', type: 'http_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' },
      { name: 'range', type: 'time_range', default: '1m' }
    ]
  },
  responsesByCode: {
    template:
      'sum by(partial_code)(label_replace(${func}(${metric}${params}[${range}]),"partial_code", "$1", "code","(.*).{2}"))',
    description: 'Response analysis by partial code',
    params: [
      { name: 'func', type: 'rate_func', default: 'rate' },
      { name: 'metric', type: 'http_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' },
      { name: 'range', type: 'time_range', default: '1m' }
    ]
  }
};
