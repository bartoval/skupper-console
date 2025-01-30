import { languages } from 'monaco-editor';

import { CreateSuggestionOptions } from '../../../types/PromBuilder.interfaces';

const getItemDescription = (kind: languages.CompletionItemKind): string => {
  switch (kind) {
    case languages.CompletionItemKind.Function:
      return 'Function';
    case languages.CompletionItemKind.Keyword:
      return 'Operator';
    case languages.CompletionItemKind.Field:
      return 'Label';
    case languages.CompletionItemKind.Variable:
      return 'Metric';
    case languages.CompletionItemKind.Operator:
      return 'Comparator';
    case languages.CompletionItemKind.Class:
      return 'Template';
    case languages.CompletionItemKind.Value:
      return 'Time Range';
    default:
      return '';
  }
};

export const createSuggestion = (options: CreateSuggestionOptions): languages.CompletionItem => {
  const { label, kind, insertText, insertTextRules, range, detail, documentation } = options;

  return {
    label: typeof label === 'string' ? { label, description: getItemDescription(kind) } : label,
    kind,
    insertText,
    insertTextRules,
    range,
    detail,
    documentation
  };
};
