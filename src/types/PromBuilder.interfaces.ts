import { RefObject } from 'react';

import type { editor, languages, IDisposable, IRange, Position } from 'monaco-editor';
import { monaco } from 'react-monaco-editor';

import { PrometheusMetricsV2 } from '../config/prometheus';
import { BinaryOperatorSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getBinaryOperatorSuggestions';
import { ComparatorSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getComparatorSuggestions';
import { FunctionOrMetricSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getFunctionMetricSuggestions';
import { GroupingOperatorSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getGroupingOperatorSuggestions';
import { LabelSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getLabelSuggestions';
import { TimeUnitSuggestionsProps } from '../pages/PromqlBuilder/config/completition/suggestions/getTimeUnitSuggestions';

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
    validation?: (value: string) => boolean;
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
  timeUnits: { value: string; description: string }[];
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

export type ValidTokenType =
  | 'label'
  | 'grouping-operator'
  | 'binary-operator'
  | 'function-or-metric'
  | 'time-range'
  | 'comparator';

export type TokenAnalysis = {
  type: ValidTokenType | 'grouping-and-binary' | 'any';
  context?: string | OperatorContext;
};

export interface SuggestController extends editor.IEditorContribution {
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
  position?: number;
}

export interface PromQLError {
  message: string;
  startPosition: number;
  endPosition: number;
}

type ValidationFunction = (query: string) => {
  isValid: boolean;
  position?: number;
};

export interface ValidationErrorDefinition {
  validationFunction: ValidationFunction;
  message: string;
  includeCondition?: (query: string) => boolean; // Condition to include the validation
}

export interface CreateSuggestionOptions {
  label: string | { label: string; description?: string };
  kind: languages.CompletionItemKind;
  insertText: string;
  insertTextRules?: languages.CompletionItemInsertTextRule;
  range: IRange;
  detail?: string;
  documentation?: { value: string };
}

export type SuggestionProviderProps =
  | LabelSuggestionsProps
  | TimeUnitSuggestionsProps
  | ComparatorSuggestionsProps
  | GroupingOperatorSuggestionsProps
  | BinaryOperatorSuggestionsProps
  | FunctionOrMetricSuggestionsProps;

export type SuggestionProviderFunction<T extends SuggestionProviderProps> = (params: T) => languages.CompletionItem[];

export interface TokenTypeToPropsMap {
  label: LabelSuggestionsProps;
  comparator: ComparatorSuggestionsProps;
  'time-range': TimeUnitSuggestionsProps;
  'grouping-operator': GroupingOperatorSuggestionsProps;
  'binary-operator': BinaryOperatorSuggestionsProps;
  'function-or-metric': FunctionOrMetricSuggestionsProps;
}

export interface TokenTypeToParamsMap {
  label: (range: IRange, tokenType: TokenAnalysis) => LabelSuggestionsProps;
  comparator: (range: IRange, tokenType: TokenAnalysis) => ComparatorSuggestionsProps;
  'time-range': (
    range: IRange,
    tokenType: TokenAnalysis,
    textUntilPosition: string,
    position: Position
  ) => TimeUnitSuggestionsProps;
  'grouping-operator': (range: IRange, tokenType: TokenAnalysis) => GroupingOperatorSuggestionsProps;
  'binary-operator': (range: IRange, tokenType: TokenAnalysis) => BinaryOperatorSuggestionsProps;
  'function-or-metric': (range: IRange, tokenType: TokenAnalysis) => FunctionOrMetricSuggestionsProps;
}

export interface MonacoRefs {
  editor: editor.IStandaloneCodeEditor | null;
  disposables: IDisposable[];
}

export interface UseSearchReturn {
  editorRef: RefObject<MonacoRefs>;
  monacoInstanceRef: RefObject<typeof monaco | null>; // Ref to Monaco instance
  query: string;
  errors: PromQLError[];
  handleEditorChange: (value: string) => void;
  handleExecuteQuery: () => void;
  handleDidMount: (editor: editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => void;
}
