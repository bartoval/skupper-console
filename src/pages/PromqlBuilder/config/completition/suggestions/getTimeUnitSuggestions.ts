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
}: TimeUnitSuggestionsProps): languages.CompletionItem[] => {
  if (!position || !textUntilPosition) {
    return [];
  }

  const suggestions: languages.CompletionItem[] = [];

  if (tokenType.type === 'time-range' || tokenType.type === 'subquery') {
    const lastOpenBracket = textUntilPosition.lastIndexOf('[');
    if (lastOpenBracket === -1) {
      return [];
    }

    const textInsideBracket = textUntilPosition.substring(lastOpenBracket + 1);
    const isAfterColon = textInsideBracket.includes(':');

    // Handle subquery step suggestions
    if (isAfterColon && /:\d+$/.test(textInsideBracket)) {
      return TIME_UNITS.map((unit) => ({
        label: { label: unit.value, description: `Step ${unit.description}` },
        kind: languages.CompletionItemKind.Value,
        insertText: `${unit.value}]`,
        detail: `Step unit - ${unit.description}`,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column
        }
      }));
    }

    // Handle range suggestions (both for simple range and subquery range)
    if (/\d+$/.test(textInsideBracket)) {
      return TIME_UNITS.map((unit) => ({
        label: { label: unit.value, description: unit.description },
        kind: languages.CompletionItemKind.Value,
        // If we're in a subquery context but not after the colon, add the colon
        insertText: tokenType.type === 'subquery' && !isAfterColon ? `${unit.value}:` : `${unit.value}]`,
        detail: `Range unit - ${unit.description}`,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column
        }
      }));
    }
  }

  return suggestions;
};
