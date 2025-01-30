// src/components/PromqlBuilder/validation/promql.validation.ts
import * as monaco from 'monaco-editor';

import { PromQLError } from '../../../types/PromBuilder.interfaces';
import { PROMETHEUS_DICTIONARY } from '../config/Dictionary';
import { LANGUAGE_ID, TIME_UNITS } from '../PromqlBuilder.constants';

const hasValidAggregation = (query: string): { isValid: boolean; position?: number } => {
  const aggRegex = new RegExp(`(${PROMETHEUS_DICTIONARY.getAggregators().join('|')})\\s*\\([^)]*\\)`, 'i');
  const match = query.match(aggRegex);

  return {
    isValid: Boolean(match),
    position: match?.index
  };
};

const hasBalancedBrackets = (query: string): { isValid: boolean; position?: number } => {
  const stack: { char: string; position: number }[] = [];
  const brackets: Record<string, string> = {
    '(': ')',
    '{': '}',
    '[': ']'
  };

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if ('({['.includes(char)) {
      stack.push({ char, position: i });
    } else if (')}]'.includes(char)) {
      const last = stack.pop();
      if (!last || brackets[last.char] !== char) {
        return { isValid: false, position: i };
      }
    }
  }

  if (stack.length > 0) {
    return { isValid: false, position: stack[stack.length - 1].position };
  }

  return { isValid: true };
};

const hasValidMetricNames = (query: string): { isValid: boolean; position?: number } => {
  for (const metric of PROMETHEUS_DICTIONARY.metrics) {
    const position = query.indexOf(metric);
    if (position !== -1) {
      return { isValid: true };
    }
  }

  return { isValid: false, position: 0 };
};

const hasValidTimeRange = (query: string): { isValid: boolean; position?: number } => {
  // Cerca pattern come [numero+unità]
  const timeRangeRegex = /\[(\d+[smhdwy])\]/;
  const matches = query.match(timeRangeRegex);

  if (!matches) {
    // Trova la posizione della parentesi quadra aperta
    const openBracket = query.indexOf('[');

    return {
      isValid: false,
      position: openBracket > -1 ? openBracket : undefined
    };
  }

  // Verifica che l'unità di tempo sia valida
  const timeUnit = matches[1].slice(-1);
  if (!TIME_UNITS.some((unit) => unit.value === timeUnit)) {
    return {
      isValid: false,
      position: matches.index
    };
  }

  return { isValid: true };
};

const hasValidLabelMatchers = (query: string): { isValid: boolean; position?: number } => {
  const labelRegex = /{([^}]+)}/;
  const match = query.match(labelRegex);
  if (!match) {
    return { isValid: false, position: query.indexOf('{') };
  }

  const labelContent = match[1];
  const labelMatchers = labelContent.split(',').map((m) => m.trim());

  const isValid = labelMatchers.every((matcher) => {
    const parts = matcher.split(/([=!~<>]+)/);

    return parts.length === 3 && parts[0].trim().length > 0 && parts[2].trim().length > 0;
  });

  return {
    isValid,
    position: match.index
  };
};

const hasBinaryOperators = (query: string): boolean => {
  const binaryRegex = /[+\-*/%^]/;

  return binaryRegex.test(query);
};

const hasValidBinaryExpression = (query: string): { isValid: boolean; position?: number } => {
  const binaryRegex = /[\w_]+\s*[+\-*/%^]\s*[\w_]+/;
  const match = query.match(binaryRegex);

  return {
    isValid: Boolean(match),
    position: match?.index
  };
};

const hasValidRateUsage = (query: string): { isValid: boolean; position?: number } => {
  // Look pattern like rate(<metric>) without range vector
  const rateRegex = /rate\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*[^[]*\)/;
  const match = query.match(rateRegex);

  if (match) {
    return {
      isValid: false,
      position: match.index
    };
  }

  return { isValid: true };
};

const hasValidStringFormat = (query: string): { isValid: boolean; position?: number } => {
  const invalidStringRegex = /['`][^'`]*['`]/;
  const match = query.match(invalidStringRegex);

  if (match) {
    return {
      isValid: false,
      position: match.index
    };
  }

  const doubleQuoteRegex = /"[^"]*"/;
  const hasStrings = query.includes("'") || query.includes('`') || query.includes('"');

  if (hasStrings && !doubleQuoteRegex.test(query)) {
    return {
      isValid: false,
      position: query.indexOf("'") !== -1 ? query.indexOf("'") : query.indexOf('`')
    };
  }

  return { isValid: true };
};
export const validatePromQLWithPositions = (query: string): PromQLError[] => {
  const errors: PromQLError[] = [];

  if (!query.trim()) {
    errors.push({
      message: 'Query cannot be empty',
      startPosition: 0,
      endPosition: 0
    });

    return errors;
  }

  const bracketsResult = hasBalancedBrackets(query);
  if (!bracketsResult.isValid && bracketsResult.position !== undefined) {
    errors.push({
      message: 'Brackets are not balanced',
      startPosition: bracketsResult.position,
      endPosition: bracketsResult.position + 1
    });
  }

  const metricsResult = hasValidMetricNames(query);
  if (!metricsResult.isValid) {
    errors.push({
      message: 'Query must contain at least one valid metric name',
      startPosition: 0,
      endPosition: query.length
    });
  }

  if (query.includes('[')) {
    const timeResult = hasValidTimeRange(query);
    if (!timeResult.isValid && timeResult.position !== undefined) {
      errors.push({
        message: 'Invalid time range format',
        startPosition: timeResult.position,
        endPosition: timeResult.position + query.substring(timeResult.position).indexOf(']') + 1
      });
    }
  }

  if (query.includes('{')) {
    const labelResult = hasValidLabelMatchers(query);
    if (!labelResult.isValid && labelResult.position !== undefined) {
      errors.push({
        message: 'Invalid label matcher syntax',
        startPosition: labelResult.position,
        endPosition: labelResult.position + query.substring(labelResult.position).indexOf('}') + 1
      });
    }
  }

  if (hasBinaryOperators(query)) {
    const binaryResult = hasValidBinaryExpression(query);
    if (!binaryResult.isValid && binaryResult.position !== undefined) {
      errors.push({
        message: 'Invalid binary expression',
        startPosition: binaryResult.position,
        endPosition: binaryResult.position + 1
      });
    }
  }

  if (query.includes('rate(')) {
    const rateResult = hasValidRateUsage(query);
    if (!rateResult.isValid && rateResult.position !== undefined) {
      const startPos = rateResult.position;
      const endPos = query.indexOf(')', startPos) + 1;

      errors.push({
        message: 'Function "rate" requires a range vector parameter (e.g., [1m])',
        startPosition: startPos,
        endPosition: endPos
      });
    }
  }

  const aggResult = hasValidAggregation(query);
  if (!aggResult.isValid && aggResult.position !== undefined) {
    errors.push({
      message: 'Invalid aggregation expression',
      startPosition: aggResult.position,
      endPosition: query.length
    });
  }

  const stringResult = hasValidStringFormat(query);
  if (!stringResult.isValid && stringResult.position !== undefined) {
    errors.push({
      message: 'Invalid string format. PromQL strings must use double quotes ("")',
      startPosition: stringResult.position,
      endPosition: stringResult.position + 1
    });
  }

  return errors;
};

export const applyErrorMarkers = (model: monaco.editor.ITextModel, errors: PromQLError[]) => {
  const markers: monaco.editor.IMarkerData[] = errors.map((error) => ({
    severity: monaco.MarkerSeverity.Error,
    message: error.message,
    startLineNumber: 1,
    startColumn: error.startPosition + 1,
    endLineNumber: 1,
    endColumn: error.endPosition + 1
  }));

  monaco.editor.removeAllMarkers(LANGUAGE_ID);
  monaco.editor.setModelMarkers(model, LANGUAGE_ID, markers);
};
