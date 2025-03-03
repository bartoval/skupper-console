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

const filterDisplayLabels = (labels: PrometheusLabelsV2[]): PrometheusLabelsV2[] =>
  labels.filter((label) => !label.toLowerCase().includes('id'));

const getAllLabels = () => filterDisplayLabels(Object.values(PrometheusLabelsV2));

export const PROMETHEUS_DICTIONARY: PrometheusDictionary = {
  templates: PROMETHEUS_TEMPLATES,
  metrics: Object.values(PrometheusMetricsV2),
  metricTypes,
  operators: {
    // Aggregation operators
    aggregation: {
      operators: [
        'sum', // Sum over dimensions
        'min', // Minimum over dimensions
        'max', // Maximum over dimensions
        'avg', // Average over dimensions
        'group', // Group values with the same value
        'stddev', // Population standard deviation over dimensions
        'stdvar', // Population standard variance over dimensions
        'count', // Count number of elements in vector
        'count_values', // Count number of elements with the same value
        'bottomk', // Smallest k elements by sample value
        'topk', // Largest k elements by sample value
        'quantile' // φ-quantile (0 ≤ φ ≤ 1) over dimensions
      ],
      validNextOperators: ['on', 'ignoring', 'group_right', 'group_left', 'by', 'without']
    },
    // Grouping operators
    grouping: {
      operators: [
        'on', // Match on specified labels
        'ignoring', // Match on all labels except specified
        'group_left', // Group left side labels
        'group_right', // Group right side labels
        'by', // Group by specified labels
        'without' // Group by all labels except specified
      ],
      requiresParenthesis: true
    },
    // Binary operators
    binary: {
      arithmetic: {
        operators: [
          '+', // Addition
          '-', // Subtraction
          '*', // Multiplication
          '/', // Division
          '%', // Modulo
          '^' // Power/Exponentiation
        ],
        validContext: 'between_vectors'
      },
      comparison: {
        operators: [
          '==', // Equal
          '!=', // Not equal
          '>', // Greater than
          '<', // Less than
          '>=', // Greater or equal
          '<=' // Less or equal
        ],
        validContext: 'between_vectors'
      },
      set: {
        operators: [
          'and', // Intersection
          'or', // Union
          'unless' // Complement
        ],
        validContext: 'between_vectors'
      }
    },
    // Modifiers
    modifiers: {
      offset: {
        operator: 'offset',
        requiresTimeRange: true,
        description: 'Offset backwards from the evaluation time'
      },
      bool: {
        operator: 'bool',
        description: 'Convert to 0 or 1 based on value being non-zero'
      },
      at: {
        operator: '@',
        requiresTimestamp: true,
        description: 'Evaluate instant vector at specific timestamp'
      }
    }
  },
  // Comparison and matching operators
  comparators: {
    equality: ['=', '!='], // Equal, Not equal
    ordering: ['>', '<', '>=', '<='], // Ordering comparisons
    matching: ['=~', '!~'], // Regex match, Regex not match
    arithmetic: ['+', '-', '*', '/', '%', '^'] // Arithmetic operators
  },
  // PromQL functions
  functions: {
    // Rate functions
    rate: [
      'rate', // Per-second rate of increase
      'irate', // Instant rate of increase
      'increase' // Total increase in time range
    ],
    // Aggregation and utility functions
    aggregate: [
      // Value transformations
      'abs', // Absolute value
      'ceil', // Round up
      'floor', // Round down
      'round', // Round to nearest integer
      'clamp_max', // Upper limit value
      'clamp_min', // Lower limit value
      'exp', // Exponential function
      'ln', // Natural logarithm
      'log2', // Binary logarithm
      'log10', // Decimal logarithm
      'sqrt', // Square root

      // Time series analysis
      'changes', // Number of value changes
      'delta', // Difference between first and last value
      'idelta', // Difference between last two values
      'deriv', // Per-second derivative
      'predict_linear', // Linear prediction
      'rate', // Per-second average rate of increase
      'irate', // Instant rate of increase
      'increase', // Total increase in time range

      // Over_time functions
      'avg_over_time', // Average over time
      'min_over_time', // Minimum over time
      'max_over_time', // Maximum over time
      'sum_over_time', // Sum over time
      'count_over_time', // Count over time
      'quantile_over_time', // Quantile over time
      'stddev_over_time', // Standard deviation over time
      'stdvar_over_time', // Standard variance over time
      'last_over_time', // Last value over time
      'present_over_time', // Check if metric present
      'absent_over_time', // Check if metric absent

      // Histograms
      'histogram_quantile', // Calculate quantile from histogram

      // Label manipulation
      'label_replace', // Replace label value
      'label_join', // Join labels

      // Type conversions
      'vector', // Convert scalar to vector
      'scalar', // Convert single-element vector to scalar

      // Special functions
      'sort', // Sort ascending
      'sort_desc', // Sort descending
      'timestamp', // Timestamp of each sample

      // Time functions
      'time', // Seconds since epoch
      'day_of_month', // Day of month (1-31)
      'day_of_week', // Day of week (0-6)
      'days_in_month', // Number of days in month
      'hour', // Hour of day (0-23)
      'minute', // Minute of hour (0-59)
      'month', // Month of year (1-12)
      'year', // Year

      // Aggregation functions (when used with by/without)
      'sum', // Sum over dimensions
      'min', // Minimum over dimensions
      'max', // Maximum over dimensions
      'avg', // Average over dimensions
      'group', // Group values
      'stddev', // Standard deviation over dimensions
      'stdvar', // Standard variance over dimensions
      'count', // Count elements
      'count_values', // Count unique values
      'bottomk', // K smallest elements
      'topk', // K largest elements
      'quantile' // Compute quantile over dimensions
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
  // Subquery syntax support
  subquery: {
    syntax: {
      range: TIME_UNITS, // reuse time units for range
      step: TIME_UNITS, // reuse time units for step
      format: '[<range>:<step>]',
      description: 'Subquery allows running an instant query for each step through a range'
    },
    validation: {
      requiresRange: true,
      requiresStep: true,
      allowedContexts: ['function_parameter', 'after_metric']
    }
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
