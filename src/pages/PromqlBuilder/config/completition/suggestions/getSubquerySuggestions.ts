import { languages } from 'monaco-editor';

import { SubquerySuggestionsProps } from '../../../../../types/PromBuilder.interfaces';
import { TIME_UNITS } from '../../../PromqlBuilder.constants';
import { createSuggestion } from '../../../utils/completition';

export const getSubquerySuggestions = ({
  range,
  textUntilPosition
}: SubquerySuggestionsProps): languages.CompletionItem[] => {
  const lastColon = textUntilPosition.lastIndexOf(':');
  const isAfterColon = lastColon > -1 && lastColon > textUntilPosition.lastIndexOf('[');

  if (isAfterColon) {
    return TIME_UNITS.map((unit) =>
      createSuggestion({
        label: { label: unit.value, description: `Step ${unit.description}` },
        kind: languages.CompletionItemKind.Value,
        insertText: `${unit.value}]`,
        range,
        detail: 'Subquery step unit',
        documentation: { value: `Set step size to ${unit.description}` }
      })
    );
  }

  return TIME_UNITS.map((unit) =>
    createSuggestion({
      label: { label: unit.value, description: `Range ${unit.description}` },
      kind: languages.CompletionItemKind.Value,
      insertText: `${unit.value}:`,
      range,
      detail: 'Subquery range unit',
      documentation: { value: `Set range to ${unit.description}` }
    })
  );
};
