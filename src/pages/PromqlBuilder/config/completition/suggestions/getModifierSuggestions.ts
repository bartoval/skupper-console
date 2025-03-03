import { languages } from 'monaco-editor';

import { ModifierSuggestionsProps } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

export const getModifierSuggestions = ({ range, tokenType }: ModifierSuggestionsProps): languages.CompletionItem[] => {
  // Verifichiamo se siamo nel contesto corretto per i modificatori
  if (tokenType.context !== 'after_metric') {
    return [];
  }

  const modifiers = [
    {
      label: PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
      description: PROMETHEUS_DICTIONARY.operators.modifiers.offset.description,
      insertText: 'offset '
    },
    {
      label: PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator,
      description: PROMETHEUS_DICTIONARY.operators.modifiers.bool.description,
      insertText: 'bool'
    },
    {
      label: PROMETHEUS_DICTIONARY.operators.modifiers.at.operator,
      description: PROMETHEUS_DICTIONARY.operators.modifiers.at.description,
      insertText: '@'
    }
  ];

  return modifiers.map((mod) =>
    createSuggestion({
      label: { label: mod.label, description: mod.description },
      kind: languages.CompletionItemKind.Keyword,
      insertText: mod.insertText,
      insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail: 'Modifier',
      documentation: { value: mod.description }
    })
  );
};
