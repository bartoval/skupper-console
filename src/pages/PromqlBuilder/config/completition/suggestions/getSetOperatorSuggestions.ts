import { languages } from 'monaco-editor';

import { SetOperatorSuggestionsProps } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

export const getSetOperatorSuggestions = ({ range }: SetOperatorSuggestionsProps): languages.CompletionItem[] =>
  PROMETHEUS_DICTIONARY.operators.binary.set.operators.map((operator) =>
    createSuggestion({
      label: operator,
      kind: languages.CompletionItemKind.Keyword,
      insertText: `${operator} `,
      range,
      detail: 'Set operator',
      documentation: { value: `Use ${operator} for set operations` }
    })
  );
