import { PrometheusLabelsV2, PrometheusMetricsV2 } from '../../../config/prometheus';
import { QueryTemplate } from '../../../types/PromBuilder.interfaces';

export const PROMETHEUS_TEMPLATES: Record<string, QueryTemplate> = {
  sumByteRate: {
    template: 'sum by(${1:label})(rate(${2:metric}${3:}[30s]))',
    description: 'Calculates the rate with grouping',
    params: [
      { name: 'label', type: 'label_name', default: 'label_name' },
      { name: 'metric', type: 'bytes_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', optional: true, default: '{}' }
    ]
  },
  histogramQuantile: {
    template: 'histogram_quantile(${1:quantile}, sum(increase(${2:metric}${3:}[${4:range}]))by(le))',
    description: 'Calculates the percentile from histogram buckets',
    params: [
      { name: 'quantile', type: 'number', default: '0.95' },
      { name: 'metric', type: 'histogram_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' },
      { name: 'range', type: 'time_range', default: '1m' }
    ]
  },
  openConnections: {
    template: 'sum(${1:metric}${2:})',
    description: 'Calculates open connections',
    params: [
      { name: 'metric', type: 'connection_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' }
    ]
  },
  requestRateByMethod: {
    template: 'sum by(method)(rate(${1:metric}${2:}[${3:range}]))',
    description: 'Request rate grouped by method',
    params: [
      { name: 'metric', type: 'http_metric', default: 'metric_name' },
      { name: 'params', type: 'label_matcher', default: '{}' },
      { name: 'range', type: 'time_range', default: '1m' }
    ]
  },
  responsesByCode: {
    template:
      'sum by(partial_code)(label_replace(increase(${1:metric}{${2:params}}[${3:range}]),"partial_code", "\\$1", "${4:codeLabel}","(.*).{2}"))',
    description: 'Response analysis by partial code',
    params: [
      { name: 'metric', type: 'http_metric', default: PrometheusMetricsV2.HttpRequests },
      { name: 'params', type: 'label_matcher', default: '' },
      { name: 'range', type: 'time_range', default: '1m' },
      { name: 'codeLabel', type: 'string', default: PrometheusLabelsV2.Code }
    ]
  }
};
