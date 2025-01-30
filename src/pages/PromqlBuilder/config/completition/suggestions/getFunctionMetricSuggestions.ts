import type { IRange } from 'monaco-editor';
import { languages } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';
import { PROMETHEUS_TEMPLATES } from '../../templates';

export interface FunctionOrMetricSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

const createDictionarySuggestions = (
  items: string[],
  kind: languages.CompletionItemKind,
  range: IRange
): languages.CompletionItem[] =>
  items.map((item) =>
    createSuggestion({
      label: item,
      kind,
      insertText: item,
      insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range
    })
  );

const createTemplateSuggestions = (range: IRange): languages.CompletionItem[] =>
  Object.entries(PROMETHEUS_TEMPLATES).map(([name, template]) =>
    createSuggestion({
      label: { label: name, description: 'Template' },
      kind: languages.CompletionItemKind.Snippet,
      insertText: template.template,
      insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail: `Template (${template.description})`,
      documentation: {
        value: `${template.description}\n\nParameters:\n${template.params
          .map((p) => `${p.name}${p.optional ? ' (optional)' : ''}: ${p.type}`)
          .join('\n')}`
      }
    })
  );

export const getFunctionOrMetricSuggestions = ({
  range,
  tokenType
}: FunctionOrMetricSuggestionsProps): languages.CompletionItem[] => {
  if (tokenType.type !== 'function-or-metric') {
    return []; // Early exit if the token type is not correct
  }

  const suggestions: languages.CompletionItem[] = [
    ...createDictionarySuggestions(
      PROMETHEUS_DICTIONARY.getAggregators(),
      languages.CompletionItemKind.Function,
      range
    ),
    ...createDictionarySuggestions(
      PROMETHEUS_DICTIONARY.getAllFunctions(),
      languages.CompletionItemKind.Function,
      range
    ),
    ...createDictionarySuggestions(PROMETHEUS_DICTIONARY.metrics, languages.CompletionItemKind.Variable, range),
    ...createTemplateSuggestions(range)
  ];

  return suggestions;
};
