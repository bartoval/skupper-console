import type { IRange } from 'monaco-editor';
import { languages } from 'monaco-editor';

import { getBinaryOperatorSuggestions } from './getBinaryOperatorSuggestions';
import { getComparatorSuggestions } from './getComparatorSuggestions';
import { getModifierSuggestions } from './getModifierSuggestions';
import { getSetOperatorSuggestions } from './getSetOperatorSuggestions';
import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';

export const getOperatorSuggestions = ({
  range,
  tokenType
}: {
  range: IRange;
  tokenType: TokenAnalysis;
}): languages.CompletionItem[] => {
  if (tokenType.context !== 'after_metric') {
    return [];
  }

  return [
    ...getSetOperatorSuggestions({ range, tokenType }),
    ...getBinaryOperatorSuggestions({ range, tokenType }),
    ...getComparatorSuggestions({ range, tokenType }),
    ...getModifierSuggestions({ range, tokenType }),

    createSuggestion({
      label: 'group_left',
      kind: languages.CompletionItemKind.Keyword,
      insertText: 'group_left ',
      range,
      detail: 'Vector Matching',
      documentation: { value: 'Group vector elements from the left side' }
    }),
    createSuggestion({
      label: 'group_right',
      kind: languages.CompletionItemKind.Keyword,
      insertText: 'group_right ',
      range,
      detail: 'Vector Matching',
      documentation: { value: 'Group vector elements from the right side' }
    })
  ];
};
