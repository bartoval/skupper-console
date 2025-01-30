import { languages } from 'monaco-editor';

import { getTokenType } from '../tokenAnalysis.utils';
import { PROMETHEUS_DICTIONARY } from './Dictionary';
import { PROMETHEUS_TEMPLATES, TIME_UNITS } from '../PromqlBuilder.constants';

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

export const completionItemsProvider: languages.CompletionItemProvider = {
  triggerCharacters: ['(', '{', '[', '.', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  provideCompletionItems: (model, position) => {
    const createSuggestion = (
      label: string | { label: string; description?: string },
      kind: languages.CompletionItemKind,
      insertText: string,
      insertTextRules?: languages.CompletionItemInsertTextRule,
      details?: {
        detail?: string;
        documentation?: {
          value: string;
        };
      }
    ): languages.CompletionItem => {
      const wordUntilPosition = model.getWordUntilPosition(position);

      return {
        label: typeof label === 'string' ? { label, description: getItemDescription(kind) } : label,
        kind,
        insertText,
        insertTextRules,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordUntilPosition.startColumn,
          endColumn: wordUntilPosition.endColumn
        },
        ...(details || {})
      };
    };

    // Get current context
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    const wordUntilPosition = model.getWordUntilPosition(position);
    const currentWord = wordUntilPosition.word.toLowerCase();
    const tokenType = getTokenType(textUntilPosition, position.column);

    let suggestions: languages.CompletionItem[] = [];

    // Provide suggestions based on context
    switch (tokenType.type) {
      case 'label':
        if (tokenType.context === 'grouping') {
          // For grouping operators, show all unique labels
          const allLabels = new Set<string>();
          Object.values(PROMETHEUS_DICTIONARY.labels).forEach((labelArray) => {
            labelArray.forEach((label) => allLabels.add(label));
          });
          suggestions = Array.from(allLabels)
            .sort()
            .map((label) =>
              createSuggestion(label, languages.CompletionItemKind.Field, label, undefined, {
                detail: 'Group By Label',
                documentation: {
                  value: `Group results by ${label}`
                }
              })
            );
        } else if (tokenType.context && PROMETHEUS_DICTIONARY.labels[tokenType.context]) {
          // For normal label matching
          suggestions = PROMETHEUS_DICTIONARY.labels[tokenType.context].map((label) =>
            createSuggestion(label, languages.CompletionItemKind.Field, label)
          );
        }
        break;

      case 'time-range': {
        // Find the last opened square bracket
        const lastOpenBracket = textUntilPosition.lastIndexOf('[');
        if (lastOpenBracket !== -1) {
          // Get text after the bracket to check for numbers
          const textInsideBracket = textUntilPosition.substring(lastOpenBracket + 1);
          // If there's a number after the bracket
          if (/\d+$/.test(textInsideBracket)) {
            // Using direct suggestion object instead of createSuggestion utility
            // because this is a special case where:
            // 1. The range needs to be at exact cursor position
            // 2. We want to append (and not filter) units to numbers rather than replace text
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
        break;
      }

      case 'comparator':
        suggestions = PROMETHEUS_DICTIONARY.getAllComparators().map((comp) =>
          createSuggestion(
            comp,
            languages.CompletionItemKind.Operator,
            `${comp} `,
            languages.CompletionItemInsertTextRule.InsertAsSnippet
          )
        );
        break;

      case 'grouping-operator':
        suggestions = PROMETHEUS_DICTIONARY.operators.grouping.operators.map((op) =>
          createSuggestion(
            op,
            languages.CompletionItemKind.Keyword,
            `${op}($0)`,
            languages.CompletionItemInsertTextRule.InsertAsSnippet
          )
        );
        break;

      case 'binary-operator':
        suggestions = PROMETHEUS_DICTIONARY.operators.binary.operators.map((op) =>
          createSuggestion(
            op,
            languages.CompletionItemKind.Keyword,
            `${op} `,
            languages.CompletionItemInsertTextRule.InsertAsSnippet
          )
        );
        break;

      case 'grouping-and-binary':
        suggestions = [
          // Add grouping operators
          ...PROMETHEUS_DICTIONARY.operators.grouping.operators.map((op) =>
            createSuggestion(
              op,
              languages.CompletionItemKind.Keyword,
              `${op}($0)`,
              languages.CompletionItemInsertTextRule.InsertAsSnippet
            )
          ),
          // Add binary operators
          ...PROMETHEUS_DICTIONARY.operators.binary.operators.map((op) =>
            createSuggestion(
              op,
              languages.CompletionItemKind.Keyword,
              `${op} `,
              languages.CompletionItemInsertTextRule.InsertAsSnippet
            )
          )
        ];
        break;

      case 'function-or-metric':
        suggestions.push(
          ...PROMETHEUS_DICTIONARY.getAggregators().map((agg) =>
            createSuggestion(
              agg,
              languages.CompletionItemKind.Function,
              `${agg}`,
              languages.CompletionItemInsertTextRule.InsertAsSnippet
            )
          ),
          ...PROMETHEUS_DICTIONARY.getAllFunctions().map((func) =>
            createSuggestion(
              func,
              languages.CompletionItemKind.Function,
              `${func}($0)`,
              languages.CompletionItemInsertTextRule.InsertAsSnippet
            )
          ),
          ...PROMETHEUS_DICTIONARY.metrics.map((metric) =>
            createSuggestion(metric, languages.CompletionItemKind.Variable, metric)
          ),
          ...Object.entries(PROMETHEUS_TEMPLATES).map(([name, template]) =>
            createSuggestion(
              name,
              languages.CompletionItemKind.Class,
              template.template,
              languages.CompletionItemInsertTextRule.InsertAsSnippet,
              {
                detail: 'Template',
                documentation: {
                  value: `${template.description}\n\nParameters:\n${template.params
                    .map((p) => `${p.name}${p.optional ? ' (optional)' : ''}: ${p.type}`)
                    .join('\n')}`
                }
              }
            )
          )
        );
        break;

      default:
        suggestions = [];
        break;
    }

    // Filter suggestions based on current input
    return {
      suggestions:
        tokenType.type === 'time-range'
          ? suggestions
          : suggestions.filter((s) => {
              const label = typeof s.label === 'string' ? s.label : s.label.label;

              return label.toLowerCase().includes(currentWord);
            })
    };
  }
};
