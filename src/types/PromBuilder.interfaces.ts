import * as monaco from 'monaco-editor';

import { PrometheusMetricsV2 } from '../config/prometheus';

export interface MetricTypes {
  bytes_metric: PrometheusMetricsV2[];
  http_metric: PrometheusMetricsV2[];
  histogram_metric: PrometheusMetricsV2[];
  connection_metric: PrometheusMetricsV2[];
}

export interface QueryTemplate {
  template: string;
  description: string;
  params: {
    name: string;
    type: string;
    default?: string;
    optional?: boolean;
  }[];
}

export interface PrometheusDictionary {
  templates: Record<string, QueryTemplate>;
  metrics: string[];
  metricTypes?: MetricTypes;
  operators: {
    aggregation: {
      operators: string[];
      validNextOperators: string[];
    };
    grouping: {
      operators: string[];
      requiresParenthesis: boolean;
    };
    binary: {
      operators: string[];
      validContext: string;
    };
    modifiers: {
      offset: {
        operator: string;
        requiresTimeRange: boolean;
      };
      bool: {
        operator: string;
      };
    };
  };
  comparators: {
    equality: string[];
    ordering: string[];
    matching: string[];
    arithmetic: string[];
  };
  functions: {
    rate: string[];
    aggregate: string[];
  };
  labels: {
    [key: string]: string[];
  };
  getAllComparators(): string[];
  getAllFunctions(): string[];
  getAllGroupingOperators(): string[];
  getAggregators(): string[];
}

export type OperatorContext =
  | 'after_aggregation'
  | 'between_vectors'
  | 'end_of_vector'
  | 'inside_parenthesis'
  | 'start_of_query';

export type TokenAnalysis = {
  type:
    | 'label'
    | 'aggregation-operator'
    | 'grouping-operator'
    | 'grouping-and-binary'
    | 'binary-operator'
    | 'modifier'
    | 'function-or-metric'
    | 'comparator'
    | 'time-range'
    | 'any';
  context?: string | OperatorContext;
};

export interface SuggestController extends monaco.editor.IEditorContribution {
  model: {
    state: number;
  };
  widget: {
    value: {
      suggestWidget: {
        widget: {
          element: HTMLElement;
        };
      };
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PromQLError {
  message: string;
  startPosition: number;
  endPosition: number;
}
