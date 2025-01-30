import type { IRange } from 'monaco-editor';
import { languages } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Provides completion items for label names in PromQL, adapting suggestions
 * based on the current context (e.g., grouping operators, label matching).
 *
 * The suggestions are determined as follows:
 *   - If the context is 'grouping' (inside `by` or `without`):
 *     Provides a list of all unique label names from PROMETHEUS_DICTIONARY.labels.
 *   - If the context is a valid label context found in PROMETHEUS_DICTIONARY.labels:
 *     Provides a list of label names specific to that context.
 *   - Otherwise: returns an empty array of suggestions.
 */

export interface LabelSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

export const getLabelSuggestions = ({ range, tokenType }: LabelSuggestionsProps): languages.CompletionItem[] => {
  let suggestions: languages.CompletionItem[] = [];

  if (tokenType.context === 'grouping') {
    // For grouping operators, show all unique labels
    const allLabels = new Set<string>();
    Object.values(PROMETHEUS_DICTIONARY.labels).forEach((labelArray) => {
      labelArray.forEach((label) => allLabels.add(label));
    });
    suggestions = Array.from(allLabels)
      .sort()
      .map((label) =>
        createSuggestion({
          label,
          kind: languages.CompletionItemKind.Field,
          insertText: label,
          range,
          detail: 'Group By Label',
          documentation: {
            value: `Group results by ${label}`
          }
        })
      );
  } else if (tokenType.context && PROMETHEUS_DICTIONARY.labels[tokenType.context]) {
    // For normal label matching
    suggestions = PROMETHEUS_DICTIONARY.labels[tokenType.context].map((label) =>
      createSuggestion({
        label,
        kind: languages.CompletionItemKind.Field,
        insertText: label,
        range
      })
    );
  }

  return suggestions;
};
