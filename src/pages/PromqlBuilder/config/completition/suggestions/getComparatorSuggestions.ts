import type { IRange } from 'monaco-editor';
import { languages } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Provides completion items for comparators in PromQL.
 *
 * The suggestions are determined as follows:
 *   - If the context is 'comparator':
 *     Provides a list of comparators (==, !=, >, <, >=, <=) from PROMETHEUS_DICTIONARY.comparators.
 *   - Otherwise: returns an empty array of suggestions.
 */

export interface ComparatorSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

export const getComparatorSuggestions = ({
  range,
  tokenType
}: ComparatorSuggestionsProps): languages.CompletionItem[] => {
  let suggestions: languages.CompletionItem[] = [];

  if (tokenType.type === 'comparator') {
    suggestions = PROMETHEUS_DICTIONARY.getAllComparators().map((comparator) =>
      createSuggestion({
        label: comparator,
        kind: languages.CompletionItemKind.Operator,
        insertText: `${comparator} `,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        detail: 'Comparison Operator',
        documentation: {
          value: `Use ${comparator} to compare values`
        }
      })
    );
  }

  return suggestions;
};
