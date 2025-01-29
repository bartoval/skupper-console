import { useState } from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertGroup,
  AlertActionCloseButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Split,
  SplitItem
} from '@patternfly/react-core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as monaco from 'monaco-editor';
import MonacoEditor from 'react-monaco-editor';

import { PrometheusApi } from '../../../API/Prometheus.api';
import { PrometheusLabelsV2, PrometheusMetricsV2 } from '../../../config/prometheus';
import { styles } from '../../../config/styles';
import SkChartArea from '../../../core/components/SkChartArea';
import SKEmptyData from '../../../core/components/SkEmptyData';
import { PrometheusMetric } from '../../../types/Prometheus.interfaces';
import './PromqlBuilder.css';

interface SuggestController extends monaco.editor.IEditorContribution {
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

type OperatorContext =
  | 'after_aggregation'
  | 'between_vectors'
  | 'end_of_vector'
  | 'inside_parenthesis'
  | 'start_of_query';

type TokenAnalysis = {
  type:
    | 'label'
    | 'aggregation-operator'
    | 'grouping-operator'
    | 'binary-operator'
    | 'modifier'
    | 'function-or-metric'
    | 'comparator'
    | 'time-range'
    | 'any';
  context?: string | OperatorContext;
};

interface MetricTypes {
  bytes_metric: PrometheusMetricsV2[];
  http_metric: PrometheusMetricsV2[];
  histogram_metric: PrometheusMetricsV2[];
  connection_metric: PrometheusMetricsV2[];
}

interface PrometheusDictionary {
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

interface QueryTemplate {
  template: string;
  description: string;
  params: {
    name: string;
    type: string;
    optional?: boolean;
  }[];
}

const LANGUAGE_ID = 'promql';

const TIME_RANGES = [
  { value: '30s', time: 30, unit: 'seconds', description: 'Last 30 seconds' },
  { value: '1m', time: 1, unit: 'seconds', description: 'Last minute' },
  { value: '5m', time: 5, unit: 'minutes', description: 'Last 5 minutes' },
  { value: '15m', time: 15, unit: 'minutes', description: 'Last 15 minutes' },
  { value: '30m', time: 30, unit: 'minutes', description: 'Last 30 minutes' },
  { value: '1h', time: 60, unit: 'minutes', description: 'Last 1 hour' },
  { value: '2h', time: 120, unit: 'minutes', description: 'Last 2 hours' },
  { value: '6h', time: 360, unit: 'minutes', description: 'Last 6 hours' },
  { value: '12h', time: 720, unit: 'minutes', description: 'Last 12 hours' },
  { value: '1d', time: 1440, unit: 'minutes', description: 'Last 1 day' },
  { value: '2d', time: 2880, unit: 'minutes', description: 'Last 2 days' },
  { value: '1w', time: 10080, unit: 'minutes', description: 'Last 1 week' },
  { value: '2w', time: 20160, unit: 'minutes', description: 'Last 2 weeks' },
  { value: '1y', time: 525600, unit: 'minutes', description: 'Last 1 year' }
];

const PROMETHEUS_TEMPLATES: Record<string, QueryTemplate> = {
  sumRateBytes: {
    template: 'sum(rate(${metric}{${params}}[${range}]))',
    description: 'Calcola il rate dei bytes in un intervallo di tempo',
    params: [
      { name: 'metric', type: 'bytes_metric' },
      { name: 'params', type: 'label_matcher' },
      { name: 'range', type: 'time_range' }
    ]
  },
  sumByMetric: {
    template: 'sum by(${groupBy})(${metric}{${params}})',
    description: 'Somma i valori raggruppati per label',
    params: [
      { name: 'groupBy', type: 'label_name' },
      { name: 'metric', type: 'metric' },
      { name: 'params', type: 'label_matcher', optional: true }
    ]
  },
  sumByteRate: {
    template: 'sum by(${groupBy})(rate(${metric}{${params}}[30s]))',
    description: 'Calcola il rate con raggruppamento',
    params: [
      { name: 'groupBy', type: 'label_name' },
      { name: 'metric', type: 'bytes_metric' },
      { name: 'params', type: 'label_matcher', optional: true }
    ]
  },
  histogramQuantile: {
    template: 'histogram_quantile(${quantile}, sum(increase(${metric}{${params}}[${range}]))by(le))',
    description: 'Calcola il percentile da bucket histogram',
    params: [
      { name: 'quantile', type: 'number' },
      { name: 'metric', type: 'histogram_metric' },
      { name: 'params', type: 'label_matcher' },
      { name: 'range', type: 'time_range' }
    ]
  },
  openConnections: {
    template: 'sum(${openMetric}{${params}}-${closeMetric}{${params}})',
    description: 'Calcola le connessioni aperte',
    params: [
      { name: 'openMetric', type: 'connection_metric' },
      { name: 'closeMetric', type: 'connection_metric' },
      { name: 'params', type: 'label_matcher' }
    ]
  },
  requestRateByMethod: {
    template: 'sum by(method)(rate(${metric}{${params}}[${range}]))',
    description: 'Rate delle richieste raggruppate per metodo',
    params: [
      { name: 'metric', type: 'http_metric' },
      { name: 'params', type: 'label_matcher' },
      { name: 'range', type: 'time_range' }
    ]
  },
  responsesByCode: {
    template:
      'sum by(partial_code)(label_replace(${func}(${metric}{${params}}[${range}]),"partial_code", "$1", "code","(.*).{2}"))',
    description: 'Analisi risposte per codice parziale',
    params: [
      { name: 'func', type: 'rate_func' },
      { name: 'metric', type: 'http_metric' },
      { name: 'params', type: 'label_matcher' },
      { name: 'range', type: 'time_range' }
    ]
  }
};

const TOKEN_TYPES = {
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

const metricTypes: MetricTypes = {
  bytes_metric: [PrometheusMetricsV2.SentBytes, PrometheusMetricsV2.ReceivedBytes],
  http_metric: [PrometheusMetricsV2.HttpRequests],
  histogram_metric: [PrometheusMetricsV2.LatencyBuckets],
  connection_metric: [PrometheusMetricsV2.TcpOpenConnections, PrometheusMetricsV2.TcpCloseCOnnections]
} as const;

const PROMETHEUS_DICTIONARY: PrometheusDictionary = {
  templates: PROMETHEUS_TEMPLATES,
  metrics: [
    'skupper_sent_bytes_total',
    'skupper_received_bytes_total',
    'legacy_flow_latency_microseconds_bucket',
    'skupper_requests_total',
    'skupper_connections_opened_total',
    'skupper_connections_closed_total'
  ],
  metricTypes,
  operators: {
    aggregation: {
      operators: ['sum', 'avg', 'min', 'max', 'count'],
      validNextOperators: ['by', 'without']
    },
    grouping: {
      operators: ['by', 'without'],
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
    matching: ['=~', '!~']
  },
  functions: {
    rate: ['rate', 'irate', 'increase'],
    aggregate: ['delta', 'histogram_quantile']
  },
  labels: {
    [PrometheusMetricsV2.SentBytes]: Object.values(PrometheusLabelsV2),
    [PrometheusMetricsV2.ReceivedBytes]: Object.values(PrometheusLabelsV2),
    [PrometheusMetricsV2.LatencyBuckets]: Object.values(PrometheusLabelsV2),
    [PrometheusMetricsV2.HttpRequests]: Object.values(PrometheusLabelsV2),
    [PrometheusMetricsV2.TcpOpenConnections]: Object.values(PrometheusLabelsV2),
    [PrometheusMetricsV2.TcpCloseCOnnections]: Object.values(PrometheusLabelsV2)
  },
  getAllComparators() {
    return [...this.comparators.equality, ...this.comparators.ordering, ...this.comparators.matching];
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

const monarchTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.promql',

  keywords: [
    ...PROMETHEUS_DICTIONARY.operators.grouping.operators,
    ...PROMETHEUS_DICTIONARY.operators.binary.operators,
    PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
    PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator
  ],

  operators: [...PROMETHEUS_DICTIONARY.getAllComparators(), '+', '-', '*', '/', '%'],

  symbols: /[=><!~?:&|+\-*^%]+/,

  tokenizer: {
    root: [
      // Aggregator functions
      [
        new RegExp(`\\b(${PROMETHEUS_DICTIONARY.operators.aggregation.operators.join('|')})\\b(?=\\s*\\()`),
        TOKEN_TYPES.AGGREGATOR
      ],

      // PromQL functions
      [new RegExp(`\\b(${PROMETHEUS_DICTIONARY.getAllFunctions().join('|')})\\b(?=\\s*\\()`), TOKEN_TYPES.FUNCTION],

      // Keywords (grouping operators, binary operators, and modifiers)
      [
        new RegExp(
          `\\b(${[
            ...PROMETHEUS_DICTIONARY.operators.grouping.operators,
            ...PROMETHEUS_DICTIONARY.operators.binary.operators,
            PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
            PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator
          ].join('|')})\\b`
        ),
        TOKEN_TYPES.KEYWORD
      ],

      // Metrics (starting with skupper_)
      [/\b(skupper_[a-zA-Z_][a-zA-Z0-9_]*)\b/, TOKEN_TYPES.METRIC],

      // Labels con vari contesti
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*[=!<>~])/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\})/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*,)/, TOKEN_TYPES.LABEL],

      // Numbers including scientific notation
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, TOKEN_TYPES.NUMBER],

      // Strings
      [/"/, { token: TOKEN_TYPES.STRING, next: '@string_double' }],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@string_single' }],

      // Operators
      [/[=<>!]=?/, TOKEN_TYPES.OPERATOR],
      [/=~|!~/, TOKEN_TYPES.OPERATOR],
      [/[+\-*/%]/, TOKEN_TYPES.OPERATOR],

      // Delimiters
      [/[{}()[\]]/, TOKEN_TYPES.DELIMITER],

      // Identifiers
      [/[a-zA-Z_]\w*/, TOKEN_TYPES.IDENTIFIER]
    ],

    string_double: [
      [/[^\\"]+/, TOKEN_TYPES.STRING],
      [/"/, { token: TOKEN_TYPES.STRING, next: '@pop' }],
      [/\\./, TOKEN_TYPES.STRING]
    ],

    string_single: [
      [/[^\\']+/, TOKEN_TYPES.STRING],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@pop' }],
      [/\\./, TOKEN_TYPES.STRING]
    ]
  }
};

const editorTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: TOKEN_TYPES.AGGREGATOR, foreground: '0000FF', fontStyle: 'bold' },
    { token: TOKEN_TYPES.FUNCTION, foreground: '795E26', fontStyle: 'bold' },
    { token: TOKEN_TYPES.KEYWORD, foreground: '0000FF' },
    { token: TOKEN_TYPES.METRIC, foreground: '267f99' },
    { token: TOKEN_TYPES.LABEL, foreground: '001080' },
    { token: TOKEN_TYPES.NUMBER, foreground: '098658' },
    { token: TOKEN_TYPES.STRING, foreground: 'A31515' },
    { token: TOKEN_TYPES.OPERATOR, foreground: '000000', fontStyle: 'bold' },
    { token: TOKEN_TYPES.DELIMITER, foreground: '000000' },
    { token: TOKEN_TYPES.IDENTIFIER, foreground: '001080' }
  ],
  colors: {
    'editor.foreground': '#000000',
    'editor.background': '#FFFFFF',
    'editor.lineHighlightBackground': '#F7F7F7',
    'editorCursor.foreground': '#000000',
    'editor.selectionBackground': '#ADD6FF'
  }
};

// Find a metric in the text by checking against the available metrics dictionary
const findCurrentMetric = (text: string) => {
  const metrics = PROMETHEUS_DICTIONARY.metrics;
  for (const metric of metrics) {
    if (text.includes(metric)) {
      return metric;
    }
  }

  return undefined;
};

// Analyze the current token context to determine appropriate suggestions
const getTokenType = (text: string, position: number): TokenAnalysis => {
  const textUntilPosition = text.substring(0, position);
  const currentWord = textUntilPosition.trim();

  // Check if we're starting to type a word
  const isStartingWord = /^[a-zA-Z]*$/.test(currentWord);

  // Check after both types of aggregation patterns
  const isAfterAggregation = (): boolean => {
    // Pattern 1: after just the aggregator name (e.g., "sum ")
    const afterName = PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) =>
      textUntilPosition.trim().endsWith(agg)
    );

    // Pattern 2: after complete aggregation function (e.g., "sum(metric)")
    const afterFunction = PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => {
      const pattern = new RegExp(`${agg}\\s*\\([^)]*\\)\\s*$`);

      return pattern.test(textUntilPosition.trim());
    });

    return afterName || afterFunction;
  };

  // Check for being inside by/without parentheses
  const isAfterGroupOperator = (): boolean => {
    const groupMatch = textUntilPosition.match(/(?:by|without)\s*\(([^)]*)?$/);

    return !!groupMatch;
  };

  // Check if we're inside parentheses
  const insideParentheses = (): boolean => {
    const openCount = (textUntilPosition.match(/\(/g) || []).length;
    const closeCount = (textUntilPosition.match(/\)/g) || []).length;

    return openCount > closeCount;
  };

  // Check if we're inside label matching braces
  const inLabelMatcher = (): boolean => {
    const openCount = (textUntilPosition.match(/{/g) || []).length;
    const closeCount = (textUntilPosition.match(/}/g) || []).length;

    return openCount > closeCount;
  };

  // Check if we're after a label inside braces (for comparator suggestions)
  const isAfterLabelInBraces = (): boolean => {
    if (!inLabelMatcher()) {
      return false;
    }
    const lastOpenBrace = textUntilPosition.lastIndexOf('{');
    const textInBraces = textUntilPosition.slice(lastOpenBrace);

    return /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(textInBraces);
  };

  // Check if we're after a square bracket (for time range suggestions)
  const isAfterSquareBracket = (): boolean => {
    const lastChar = textUntilPosition.trim().slice(-1);

    return lastChar === '[';
  };

  // Check if we're at the query start or after certain delimiters
  const atQueryStart =
    textUntilPosition.trim() === '' ||
    textUntilPosition.trim().endsWith('(') ||
    /[\s,]$/.test(textUntilPosition) ||
    position === 0 ||
    isStartingWord;

  // Check if we're between vectors (for binary operators)
  const isBetweenVectors = (): boolean => {
    const prevText = textUntilPosition.trim();

    return /}$|\)$/.test(prevText);
  };

  // Inside grouping operator parentheses (by/without)
  if (isAfterGroupOperator()) {
    return {
      type: 'label',
      context: 'grouping'
    };
  }

  // Time range after [
  if (isAfterSquareBracket()) {
    return { type: 'time-range' };
  }

  // Inside label matcher braces {}
  if (inLabelMatcher()) {
    if (isAfterLabelInBraces()) {
      return { type: 'comparator' };
    }

    return {
      type: 'label',
      context: findCurrentMetric(text)
    };
  }

  // After aggregation function (both immediate and complete)
  if (isAfterAggregation()) {
    return {
      type: 'grouping-operator',
      context: 'after_aggregation'
    };
  }

  // Between vector results
  if (isBetweenVectors()) {
    return {
      type: 'binary-operator',
      context: 'between_vectors'
    };
  }

  // At query start or inside general parentheses
  if (atQueryStart || insideParentheses()) {
    return {
      type: 'function-or-metric',
      context: atQueryStart ? 'start_of_query' : 'inside_parenthesis'
    };
  }

  return { type: 'any' };
};

const PromqlBuilder = function () {
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Configuration for Monaco editor
  const handleEditorWillMount = (monacoInstance: typeof import('monaco-editor')) => {
    // Configure theme
    monacoInstance.editor.defineTheme('promqlTheme', editorTheme);
    monacoInstance.editor.setTheme('promqlTheme');

    // Register language
    monacoInstance.languages.register({ id: LANGUAGE_ID });

    // Set tokens provider
    monacoInstance.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokensProvider);

    // Configure language settings
    monacoInstance.languages.setLanguageConfiguration(LANGUAGE_ID, {
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });

    // Register completion provider
    monacoInstance.languages.registerCompletionItemProvider(LANGUAGE_ID, {
      provideCompletionItems: (model, position) => {
        const createSuggestion = (
          label: string | { label: string; description?: string },
          kind: monaco.languages.CompletionItemKind,
          insertText: string,
          insertTextRules?: monaco.languages.CompletionItemInsertTextRule,
          details?: {
            detail?: string;
            documentation?: {
              value: string;
            };
          }
        ): monaco.languages.CompletionItem => {
          const wordUntilPosition = model.getWordUntilPosition(position);

          return {
            label: typeof label === 'string' ? { label, description: getItemDescription(kind) } : label,
            kind,
            insertText,
            insertTextRules,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: wordUntilPosition.endColumn
            },
            ...(details || {})
          };
        };

        const getItemDescription = (kind: monaco.languages.CompletionItemKind): string => {
          switch (kind) {
            case monaco.languages.CompletionItemKind.Function:
              return 'Function';
            case monaco.languages.CompletionItemKind.Keyword:
              return 'Operator';
            case monaco.languages.CompletionItemKind.Field:
              return 'Label';
            case monaco.languages.CompletionItemKind.Variable:
              return 'Metric';
            case monaco.languages.CompletionItemKind.Operator:
              return 'Comparator';
            case monaco.languages.CompletionItemKind.Class:
              return 'Template';
            case monaco.languages.CompletionItemKind.Value:
              return 'Time Range';
            default:
              return '';
          }
        };

        // Get current context
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const wordUntilPosition = model.getWordUntilPosition(position);
        const currentWord = wordUntilPosition.word.toLowerCase();
        const tokenType = getTokenType(textUntilPosition, position.column);
        let suggestions: monaco.languages.CompletionItem[] = [];

        // Provide suggestions based on context
        switch (tokenType.type) {
          case 'label':
            if (tokenType.context === 'grouping') {
              // For grouping operators, show all unique labels
              const allLabels = new Set<string>();
              Object.values(PROMETHEUS_DICTIONARY.labels).forEach((labelArray) => {
                labelArray.forEach((label) => allLabels.add(label));
              });
              suggestions = Array.from(allLabels)
                .sort()
                .map((label) =>
                  createSuggestion(label, monaco.languages.CompletionItemKind.Field, label, undefined, {
                    detail: 'Group By Label',
                    documentation: {
                      value: `Group results by ${label}`
                    }
                  })
                );
            } else if (tokenType.context && PROMETHEUS_DICTIONARY.labels[tokenType.context]) {
              // For normal label matching
              suggestions = PROMETHEUS_DICTIONARY.labels[tokenType.context].map((label) =>
                createSuggestion(label, monaco.languages.CompletionItemKind.Field, label)
              );
            }
            break;

          case 'time-range':
            suggestions = TIME_RANGES.map((range) =>
              createSuggestion(
                { label: range.value, description: range.description },
                monaco.languages.CompletionItemKind.Value,
                `${range.value}`,
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              )
            );
            break;

          case 'comparator':
            suggestions = PROMETHEUS_DICTIONARY.getAllComparators().map((comp) =>
              createSuggestion(
                comp,
                monaco.languages.CompletionItemKind.Operator,
                `${comp} `,
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              )
            );
            break;

          case 'grouping-operator':
            suggestions = PROMETHEUS_DICTIONARY.operators.grouping.operators.map((op) =>
              createSuggestion(
                op,
                monaco.languages.CompletionItemKind.Keyword,
                `${op}($0)`,
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              )
            );
            break;

          case 'binary-operator':
            suggestions = PROMETHEUS_DICTIONARY.operators.binary.operators.map((op) =>
              createSuggestion(
                op,
                monaco.languages.CompletionItemKind.Keyword,
                `${op} `,
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              )
            );
            break;

          case 'function-or-metric':
            suggestions.push(
              ...PROMETHEUS_DICTIONARY.getAggregators().map((agg) =>
                createSuggestion(
                  agg,
                  monaco.languages.CompletionItemKind.Function,
                  `${agg}($0)`,
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                )
              ),
              ...PROMETHEUS_DICTIONARY.getAllFunctions().map((func) =>
                createSuggestion(
                  func,
                  monaco.languages.CompletionItemKind.Function,
                  `${func}($0)`,
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                )
              ),
              ...PROMETHEUS_DICTIONARY.metrics.map((metric) =>
                createSuggestion(metric, monaco.languages.CompletionItemKind.Variable, metric)
              ),
              ...Object.entries(PROMETHEUS_TEMPLATES).map(([name, template]) =>
                createSuggestion(
                  name,
                  monaco.languages.CompletionItemKind.Class,
                  template.template,
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  {
                    detail: 'Template',
                    documentation: {
                      value: `${template.description}\n\nParameters:\n${template.params
                        .map((p) => `${p.name}${p.optional ? ' (optional)' : ''}: ${p.type}`)
                        .join('\n')}`
                    }
                  }
                )
              )
            );
            break;

          default:
            suggestions = [];
            break;
        }

        // Filter suggestions based on current input
        return {
          suggestions: suggestions.filter((s) => {
            const label = typeof s.label === 'string' ? s.label : s.label.label;

            return label.toLowerCase().includes(currentWord);
          })
        };
      },
      triggerCharacters: ['(', '{', '[', '.', ' ']
    });
  };

  // Query validation
  const validateQuery = (value: string) => {
    const newErrors: string[] = [];
    const brackets: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']'
    };
    const stack: string[] = [];

    // Check bracket matching
    for (const char of value) {
      if ('({['.includes(char)) {
        stack.push(char);
      } else if (')}]'.includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last] !== char) {
          newErrors.push('Parentheses not balanced');
          break;
        }
      }
    }

    if (stack.length > 0) {
      newErrors.push('Parentheses not closed');
    }

    if (value.trim() === '') {
      newErrors.push('Query cannot be empty');
    }

    setErrors(newErrors);
  };

  // Handle query changes
  const handleEditorChange = (value?: string) => {
    if (value) {
      setQuery(value);
      validateQuery(value);
    }
  };

  // Query execution
  const { data, refetch } = useQuery({
    queryKey: ['PrometheusApi.fetchCustomQuery', query],
    queryFn: () =>
      PrometheusApi.fetchCustomQuery({
        query,
        start: Date.now() / 1000 - 60,
        end: Date.now() / 1000
      }),
    placeholderData: keepPreviousData,
    enabled: false
  });

  const handleExecuteQuery = () => {
    if (errors.length === 0) {
      console.log('Query execution:', query);
      refetch();
    }
  };

  // Component render
  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>PromQL Query Builder </CardTitle>
        <p>
          Start typing your query or press <b>Ctrl+Space</b> to get suggestions.
        </p>
      </CardHeader>
      <CardBody>
        <Split hasGutter>
          <SplitItem isFilled>
            <MonacoEditor
              height="35px"
              language={LANGUAGE_ID}
              theme="promqlTheme"
              value={query}
              options={{
                fontFamily: styles.default.fontFamily,
                fixedOverflowWidgets: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoClosingDelete: 'always',
                autoClosingOvertype: 'always',
                autoIndent: 'full',
                bracketPairColorization: {
                  enabled: true
                },
                minimap: { enabled: false },
                lineNumbers: 'off',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                fontSize: 24,
                suggestFontSize: 16,
                suggestLineHeight: 30,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                wordWrap: 'off',
                lineDecorationsWidth: 0,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'auto'
                },
                renderValidationDecorations: 'off',
                suggest: {
                  showIcons: true,
                  snippetsPreventQuickSuggestions: false,
                  localityBonus: true
                }
              }}
              onChange={handleEditorChange}
              editorWillMount={handleEditorWillMount}
              editorDidMount={(editor, monacoInstance) => {
                editor.onKeyDown((e) => {
                  if (e.keyCode === monacoInstance.KeyCode.Enter) {
                    const suggestController = editor.getContribution(
                      'editor.contrib.suggestController'
                    ) as SuggestController;

                    if (suggestController.model.state === 0) {
                      e.preventDefault();
                    }
                  }
                });
              }}
            />

            {errors.length > 0 && (
              <AlertGroup isToast>
                {errors.map((error, index) => (
                  <Alert
                    key={index}
                    variant="danger"
                    title={error}
                    actionClose={
                      <AlertActionCloseButton
                        onClose={() => {
                          setErrors(errors.filter((_, i) => i !== index));
                        }}
                      />
                    }
                  />
                ))}
              </AlertGroup>
            )}
          </SplitItem>

          <SplitItem>
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem align={{ default: 'alignEnd' }}>
                  <Button variant="primary" onClick={handleExecuteQuery} isDisabled={errors.length > 0 || !query}>
                    Execute Query
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </SplitItem>
        </Split>

        {data && (
          <SkChartArea
            height={700}
            formatY={(y: number) => y}
            legendLabels={extractMetricInfo(data)}
            data={convertPromQLToSkAxisXY(data)}
            isChartLine={true}
          />
        )}

        {!data && <SKEmptyData />}
      </CardBody>
    </Card>
  );
};

// Utility functions for data conversion
function convertPromQLToSkAxisXY(result: PrometheusMetric<'matrix'>[]) {
  return result.map((series) =>
    series.values.map(([timestamp, value]) => ({
      x: timestamp,
      y: value
    }))
  );
}

function extractMetricInfo(result: PrometheusMetric<'matrix'>[]) {
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

export default PromqlBuilder;
