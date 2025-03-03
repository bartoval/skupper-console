import { languages } from 'monaco-editor';
import type { editor, Position } from 'monaco-editor';

import { tokenTypeConfig, tokenTypeToParams } from './completition/tokenTypeConfig';
import { ValidTokenType } from '../../../types/PromBuilder.interfaces';
import { getTokenType } from '../utils/tokenAnalysis';
import { getTemplateSuggestions } from './completition/suggestions/getTemplateSuggestion';

const TRIGGER_CHARACTERS = ['(', '{', '[', '.', ' ', ...'0123456789'];

// Define sort order as a constant for easy modification
const SNIPPET_SORT_ORDER = '0';
const OTHER_SORT_ORDER = '1';

const addSortText = (items: languages.CompletionItem[]): languages.CompletionItem[] =>
  items.map((s) => ({
    ...s,
    sortText: s.kind === languages.CompletionItemKind.Snippet ? SNIPPET_SORT_ORDER : OTHER_SORT_ORDER
  }));

const getExpandedTemplateMatch = (word: string, lineContent: string): { template: string; param: string } | null => {
  const responsesByCodeRegex =
    /sum by\(partial_code\)\(label_replace\(increase\((metric)\{(params)\}\[(range)\]\),"partial_code", "\$1", "(codeLabel)","(.*).{2}"\)\)/;
  const match = lineContent.match(responsesByCodeRegex);

  if (match) {
    const [, metric, params, range, codeLabel] = match;

    if (word === 'metric' && metric === word) {
      return { template: 'responsesByCode', param: 'metric' };
    }
    if (word === 'params' && params === word) {
      return { template: 'responsesByCode', param: 'params' };
    }
    if (word === 'range' && range === word) {
      return { template: 'responsesByCode', param: 'range' };
    }
    if (word === 'codeLabel' && codeLabel === word) {
      return { template: 'responsesByCode', param: 'codeLabel' };
    }
  }

  return null;
};

export const completionItemProvider: languages.CompletionItemProvider = {
  triggerCharacters: TRIGGER_CHARACTERS,
  provideCompletionItems: (model: editor.ITextModel, position: Position): languages.CompletionList => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    const currentWord = model.getWordUntilPosition(position).word.toLowerCase();
    const tokenType = getTokenType(textUntilPosition, position.column);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: model.getWordUntilPosition(position).startColumn,
      endColumn: model.getWordUntilPosition(position).endColumn
    };

    let suggestions: languages.CompletionItem[] = [];
    let placeholderSuggestions: languages.CompletionItem[] = [];

    const lineContent = model.getLineContent(position.lineNumber);
    const expandedMatch = getExpandedTemplateMatch(currentWord, lineContent);
    if (expandedMatch) {
      placeholderSuggestions = getTemplateSuggestions({
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column
        },
        templateMatch: {
          template: expandedMatch?.template || '',
          param: expandedMatch?.param || ''
        }
      });
    } else if (tokenType.type in tokenTypeToParams) {
      const params = tokenTypeToParams[tokenType.type as ValidTokenType](range, tokenType, textUntilPosition, position);
      suggestions = addSortText(tokenTypeConfig[tokenType.type as ValidTokenType](params as any));
    } else if (tokenType.type === 'grouping-and-binary') {
      suggestions = addSortText([
        ...tokenTypeConfig[tokenType.type as 'grouping-operator']({ range, tokenType }),
        ...tokenTypeConfig[tokenType.type as 'binary-operator']({ range, tokenType })
      ]);
    }

    const filterSuggestions = (s: languages.CompletionItem) => {
      const label = typeof s.label === 'string' ? s.label : s.label.label;

      return label.toLowerCase().includes(currentWord);
    };

    const filteredSuggestions = tokenType.type === 'time-range' ? suggestions : suggestions.filter(filterSuggestions);

    return { suggestions: [...placeholderSuggestions, ...filteredSuggestions] };
  }
};
