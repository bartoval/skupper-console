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
      operators: string[]; // sum, min, max, etc.
      validNextOperators: string[]; // Valid operators after aggregation
    };
    grouping: {
      operators: string[]; // by, without, on, ignoring, etc.
      requiresParenthesis: boolean;
    };
    binary: {
      arithmetic: {
        operators: string[]; // +, -, *, /, %, ^
        validContext: string;
      };
      comparison: {
        operators: string[]; // ==, !=, >, <, >=, <=
        validContext: string;
      };
      set: {
        operators: string[]; // and, or, unless
        validContext: string;
      };
    };
    modifiers: {
      offset: {
        operator: string;
        requiresTimeRange: boolean;
        description: string;
      };
      bool: {
        operator: string;
        description: string;
      };
      at: {
        operator: string;
        requiresTimestamp: boolean;
        description: string;
      };
    };
  };
  comparators: {
    equality: string[]; // =, !=
    ordering: string[]; // >, <, >=, <=
    matching: string[]; // =~, !~
    arithmetic: string[]; // +, -, *, /, %, ^
  };
  functions: {
    rate: string[]; // rate, irate, increase
    aggregate: string[]; // all aggregation and utility functions
  };
  subquery: {
    syntax: {
      range: { value: string; description: string }[]; // Time units for range
      step: { value: string; description: string }[]; // Time units for step
      format: string; // [<range>:<step>]
      description: string;
    };
    validation: {
      requiresRange: boolean;
      requiresStep: boolean;
      allowedContexts: string[];
    };
  };
  labels: {
    [key: string]: string[];
  };
  timeUnits: { value: string; description: string }[];

  // Utility methods
  getAllComparators(): string[];
  getAllFunctions(): string[];
  getAllGroupingOperators(): string[];
  getAggregators(): string[];
}

// Valid contexts for token analysis
export type OperatorContext =
  | 'after_aggregation' // After an aggregation operator
  | 'between_vectors' // Between two vector expressions
  | 'end_of_vector' // At the end of a vector
  | 'inside_parenthesis' // Inside () grouping
  | 'inside_subquery' // Inside a subquery expression
  | 'after_metric' // After a metric name
  | 'inside_label_matcher' // Inside {} label matcher
  | 'after_binary' // After a binary operator
  | 'start_of_query' // At the beginning of a query
  | 'inside_function' // Inside a function call
  | 'after_modifier'; // After a query modifier

export type OperatorSubType =
  | 'arithmetic' // +, -, *, /, %, ^
  | 'comparison' // ==, !=, >, <, >=, <=
  | 'set' // and, or, unless
  | 'matching' // =~, !~
  | 'aggregation' // sum, avg, etc.
  | 'grouping'; // by, without

// Valid token types that can be returned by token analysis
export type ValidTokenType =
  | 'label' // Label identifiers
  | 'grouping-operator' // by, without, etc.
  | 'binary-operator' // Binary operations
  | 'function-or-metric' // Functions or metric names
  | 'time-range' // Time duration expressions
  | 'subquery' // Subquery expressions
  | 'comparator' // Comparison operators
  | 'modifier' // Modifiers like offset, @, bool
  | 'arithmetic' // Arithmetic operators
  | 'set-operator' // Set operations like and, or, unless
  | 'operator'; // Generic operator type, includes all operator types

export type TokenAnalysis = {
  type: ValidTokenType | 'grouping-and-binary' | 'any';
  context?: string | OperatorContext;
  subType?: OperatorSubType | 'any';
  metadata?: {
    isComplete?: boolean; // Whether the current expression is complete
    requiresClosing?: boolean; // Whether the current context needs closing
    allowedNext?: ValidTokenType[]; // Valid next token types
    previousToken?: string; // The previous token if relevant
    metrics?: string[]; // Available metrics in current context
    labels?: string[]; // Available labels in current context
  };
};

// Controller for suggestion widget behavior
export interface SuggestController extends editor.IEditorContribution {
  model: {
    state: number; // Current state of the suggestion model
    wordUntil?: string; // Current word being typed
    selectedItem?: number; // Currently selected suggestion
    items?: Array<unknown>; // Available suggestions
  };
  widget: {
    value: {
      suggestWidget: {
        widget: {
          element: HTMLElement; // DOM element of suggestion widget
          visible: boolean; // Whether widget is visible
          focusedItem?: unknown; // Currently focused suggestion item
        };
        suggestions?: Array<unknown>; // Current suggestions
        isAuto?: boolean; // Whether suggestions are automatic
      };
    };
  };
  trigger: (auto: boolean) => void; // Trigger suggestions
  cancel: () => void; // Cancel current suggestions
  selectNextItem: () => void; // Select next suggestion
  selectPreviousItem: () => void; // Select previous suggestion
  acceptSelectedSuggestion: () => void; // Accept current suggestion
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

export interface SubquerySuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
  textUntilPosition: string;
  position: Position;
}

export interface ModifierSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

export interface ArithmeticSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

// Mappa che collega i tipi di token alle loro props
export interface TokenTypeToPropsMap {
  label: LabelSuggestionsProps;
  comparator: ComparatorSuggestionsProps;
  'time-range': TimeUnitSuggestionsProps;
  'grouping-operator': GroupingOperatorSuggestionsProps;
  'binary-operator': BinaryOperatorSuggestionsProps;
  'function-or-metric': FunctionOrMetricSuggestionsProps;
  subquery: SubquerySuggestionsProps;
  modifier: ModifierSuggestionsProps;
  arithmetic: ArithmeticSuggestionsProps;
  'set-operator': SetOperatorSuggestionsProps;
  operator: SetOperatorSuggestionsProps;
}

export interface SetOperatorSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

// Mappa che collega i tipi di token alle funzioni che generano i loro parametri
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
  subquery: (
    range: IRange,
    tokenType: TokenAnalysis,
    textUntilPosition: string,
    position: Position
  ) => SubquerySuggestionsProps;
  modifier: (range: IRange, tokenType: TokenAnalysis) => ModifierSuggestionsProps;
  arithmetic: (range: IRange, tokenType: TokenAnalysis) => ArithmeticSuggestionsProps;
  'set-operator': (range: IRange, tokenType: TokenAnalysis) => SetOperatorSuggestionsProps;
  operator: (range: IRange, tokenType: TokenAnalysis) => SetOperatorSuggestionsProps;
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
