import { languages } from 'monaco-editor';
import type { Position } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { TIME_UNITS } from '../../../PromqlBuilder.constants';

/**
 * Provides completion items for time units in PromQL.
 *
 * The suggestions are determined as follows:
 *   - If the token type is 'time-range' and a number precedes the cursor within square brackets:
 *     Provides a list of time units (s, m, h, d, w, y) from TIME_UNITS,
 *     inserting the unit at the cursor position (appending, not replacing).
 *   - Otherwise: returns an empty array of suggestions.
 */

export interface TimeUnitSuggestionsProps {
  position: Position;
  textUntilPosition: string;
  tokenType: TokenAnalysis;
}

export const getTimeUnitSuggestions = ({
  tokenType,
  textUntilPosition,
  position
}: TimeUnitSuggestionsProps & {
  textUntilPosition?: string;
  position?: Position;
}): languages.CompletionItem[] => {
  let suggestions: languages.CompletionItem[] = [];

  if (tokenType.type === 'time-range' && textUntilPosition && position) {
    // Find the last opened square bracket
    const lastOpenBracket = textUntilPosition.lastIndexOf('[');

    if (lastOpenBracket !== -1) {
      // Get text after the bracket to check for numbers
      const textInsideBracket = textUntilPosition.substring(lastOpenBracket + 1);

      // If there's a number after the bracket
      if (/\d+$/.test(textInsideBracket)) {
        suggestions = TIME_UNITS.map((unit) => ({
          label: { label: unit.value, description: unit.description },
          kind: languages.CompletionItemKind.Value,
          insertText: unit.value,
          detail: unit.description,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        }));
      }
    }
  }

  return suggestions;
};
