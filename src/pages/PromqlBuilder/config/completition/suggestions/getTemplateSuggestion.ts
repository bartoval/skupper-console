import { languages } from 'monaco-editor';
import type { IRange } from 'monaco-editor';

import { PrometheusLabelsV2, PrometheusMetricsV2 } from '../../../../../config/prometheus';
import { createSuggestion } from '../../../utils/completition';

/**
 * Interface for template parameter match
 */
export interface TemplateMatch {
  template: string;
  param: string;
}

/**
 * Props for getting template suggestions
 */
export interface TemplateSuggestionsProps {
  range: IRange;
  templateMatch: TemplateMatch;
}

/**
 * Provides completion items for template parameters in PromQL.
 *
 * The suggestions are determined based on the template type and parameter:
 * - For 'metric': Provides the default HTTP metric
 * - For 'params': Provides label matchers
 * - For 'range': Provides time range options
 * - For 'codeLabel': Provides the default code label
 */
export const getTemplateSuggestions = ({
  range,
  templateMatch
}: TemplateSuggestionsProps): languages.CompletionItem[] => {
  if (templateMatch.template === 'responsesByCode') {
    switch (templateMatch.param) {
      case 'metric':
        return [
          createSuggestion({
            label: PrometheusMetricsV2.HttpRequests,
            kind: languages.CompletionItemKind.Value,
            insertText: PrometheusMetricsV2.HttpRequests,
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Default HTTP metric for requests',
            documentation: {
              value: 'Default metric for HTTP requests counting'
            }
          })
        ];

      case 'params':
        return Object.values(PrometheusLabelsV2).map((label) =>
          createSuggestion({
            label: `{${label}=""}`,
            kind: languages.CompletionItemKind.Snippet,
            insertText: `{${label}="$1"}`,
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Label matcher',
            documentation: {
              value: `Add a matcher for ${label}`
            }
          })
        );

      case 'range':
        return ['30s', '1m', '5m', '15m', '1h'].map((timeRange) =>
          createSuggestion({
            label: timeRange,
            kind: languages.CompletionItemKind.Value,
            insertText: timeRange,
            range,
            detail: 'Time range',
            documentation: {
              value: `Set time range to ${timeRange}`
            }
          })
        );

      case 'codeLabel':
        return [
          createSuggestion({
            label: PrometheusLabelsV2.Code,
            kind: languages.CompletionItemKind.Value,
            insertText: PrometheusLabelsV2.Code,
            range,
            detail: 'Code label',
            documentation: {
              value: 'Default label for response codes'
            }
          })
        ];

      default:
        return [];
    }
  }

  return [];
};
