import { PROMETHEUS_TEMPLATES } from './templates';
import { PrometheusLabelsV2, PrometheusMetricsV2 } from '../../../config/prometheus';
import { MetricTypes, PrometheusDictionary } from '../../../types/PromBuilder.interfaces';
import { TIME_UNITS } from '../PromqlBuilder.constants';

const metricTypes: MetricTypes = {
  bytes_metric: [PrometheusMetricsV2.SentBytes, PrometheusMetricsV2.ReceivedBytes],
  http_metric: [PrometheusMetricsV2.HttpRequests],
  histogram_metric: [PrometheusMetricsV2.LatencyBuckets],
  connection_metric: [PrometheusMetricsV2.TcpOpenConnections, PrometheusMetricsV2.TcpCloseCOnnections]
} as const;

/**
 * Filters labels to exclude ID fields and return only display-friendly labels.
 */
const filterDisplayLabels = (labels: PrometheusLabelsV2[]): PrometheusLabelsV2[] =>
  labels.filter((label) => !label.toLowerCase().includes('id'));

const getAllLabels = () => filterDisplayLabels(Object.values(PrometheusLabelsV2));

export const PROMETHEUS_DICTIONARY: PrometheusDictionary = {
  templates: PROMETHEUS_TEMPLATES,
  metrics: Object.values(PrometheusMetricsV2),
  metricTypes,
  operators: {
    aggregation: {
      operators: [
        'sum',
        'min',
        'max',
        'avg',
        'group',
        'stddev',
        'stdvar',
        'count',
        'count_values',
        'bottomk',
        'topk',
        'quantile'
      ],
      validNextOperators: ['on', 'ignoring', 'group_right', 'group_left', 'by', 'without']
    },
    grouping: {
      operators: ['on', 'ignoring', 'group_right', 'group_left', 'by', 'without'],
      requiresParenthesis: true
    },
    binary: {
      operators: ['and', 'or', 'unless'],
      validContext: 'between_vectors'
    },
    modifiers: {
      offset: {
        operator: 'offset',
        requiresTimeRange: true
      },
      bool: {
        operator: 'bool'
      }
    }
  },
  comparators: {
    equality: ['=', '!='],
    ordering: ['>', '<', '>=', '<='],
    matching: ['=~', '!~'],
    arithmetic: ['+', '-', '*', '/', '%', '^']
  },
  functions: {
    rate: ['rate', 'irate', 'increase'],
    aggregate: [
      'abs',
      'absent',
      'ceil',
      'changes',
      'clamp_max',
      'clamp_min',
      'day_of_month',
      'day_of_week',
      'days_in_month',
      'delta',
      'deriv',
      'exp',
      'floor',
      'histogram_quantile',
      'holt_winters',
      'hour',
      'idelta',
      'label_join',
      'label_replace',
      'ln',
      'log2',
      'log10',
      'minute',
      'month',
      'predict_linear',
      'resets',
      'round',
      'scalar',
      'sort',
      'sort_desc',
      'sqrt',
      'time',
      'timestamp',
      'vector',
      'year'
    ]
  },
  labels: {
    [PrometheusMetricsV2.SentBytes]: getAllLabels(),
    [PrometheusMetricsV2.ReceivedBytes]: getAllLabels(),
    [PrometheusMetricsV2.LatencyBuckets]: getAllLabels(),
    [PrometheusMetricsV2.HttpRequests]: getAllLabels(),
    [PrometheusMetricsV2.TcpOpenConnections]: getAllLabels(),
    [PrometheusMetricsV2.TcpCloseCOnnections]: getAllLabels()
  },
  timeUnits: TIME_UNITS,
  getAllComparators() {
    return [
      ...this.comparators.equality,
      ...this.comparators.ordering,
      ...this.comparators.matching,
      ...this.comparators.arithmetic
    ];
  },
  getAllFunctions() {
    return [...this.functions.rate, ...this.functions.aggregate];
  },
  getAllGroupingOperators() {
    return this.operators.grouping.operators;
  },
  getAggregators() {
    return this.operators.aggregation.operators;
  }
};
