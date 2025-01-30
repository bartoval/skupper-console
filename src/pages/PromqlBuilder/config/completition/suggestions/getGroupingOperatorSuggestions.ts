import { languages } from 'monaco-editor';
import type { IRange } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Provides completion items for grouping operators in PromQL.
 *
 * The suggestions are determined as follows:
 *   - If the context is 'grouping-operator':
 *     Provides a list of grouping operators (by, without) from PROMETHEUS_DICTIONARY.operators.grouping.operators.
 *   - Otherwise: returns an empty array of suggestions.
 */

export interface GroupingOperatorSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

export const getGroupingOperatorSuggestions = ({
  range,
  tokenType
}: GroupingOperatorSuggestionsProps): languages.CompletionItem[] => {
  let suggestions: languages.CompletionItem[] = [];

  if (tokenType.type === 'grouping-operator') {
    suggestions = PROMETHEUS_DICTIONARY.operators.grouping.operators.map((operator) =>
      createSuggestion({
        label: operator,
        kind: languages.CompletionItemKind.Keyword,
        insertText: `${operator}($0)`,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        detail: 'Grouping Operator',
        documentation: {
          value: `Use ${operator} to group results`
        }
      })
    );
  }

  return suggestions;
};
