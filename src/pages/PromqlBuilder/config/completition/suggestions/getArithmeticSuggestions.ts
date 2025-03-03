import { languages } from 'monaco-editor';

import { ArithmeticSuggestionsProps } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

export const getArithmeticSuggestions = ({ range }: ArithmeticSuggestionsProps): languages.CompletionItem[] =>
  PROMETHEUS_DICTIONARY.operators.binary.arithmetic.operators.map((operator) =>
    createSuggestion({
      label: operator,
      kind: languages.CompletionItemKind.Operator,
      insertText: `${operator} `,
      range,
      detail: 'Arithmetic operator',
      documentation: { value: `Use ${operator} for arithmetic operations` }
    })
  );
