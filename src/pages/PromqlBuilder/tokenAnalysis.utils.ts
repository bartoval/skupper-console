import { PROMETHEUS_DICTIONARY } from './config/Dictionary';
import { TokenAnalysis } from '../../types/PromBuilder.interfaces';

// Find a metric in the text by checking against the available metrics dictionary
const findCurrentMetric = (text: string) => {
  const metrics = PROMETHEUS_DICTIONARY.metrics;
  for (const metric of metrics) {
    if (text.includes(metric)) {
      return metric;
    }
  }

  return undefined;
};

// Analyze the current token context to determine appropriate suggestions
export const getTokenType = (text: string, position: number): TokenAnalysis => {
  const textUntilPosition = text.substring(0, position);
  const currentWord = textUntilPosition.trim();

  // Check if we're starting to type a word
  const isStartingWord = /^[a-zA-Z]*$/.test(currentWord);

  const isAfterAggregation = (): boolean =>
    // Pattern 1: just the aggregator name
    PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => textUntilPosition.trim().endsWith(agg));

  const isAfterCompleteAggregation = (): boolean =>
    // Pattern 2: complete aggregation with parentheses
    PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => {
      const pattern = new RegExp(`${agg}\\s*\\(([^)]*|\\(([^)]*|\\(([^)]*)\\))*\\))*\\)`); // Matches nested parens

      return pattern.test(textUntilPosition.trim());
    });

  // Check for being inside by/without parentheses
  const isAfterGroupOperator = (): boolean => {
    const groupMatch = textUntilPosition.match(/(?:by|without)\s*\(([^)]*)?$/);

    return !!groupMatch;
  };

  // Check if we're inside parentheses
  const insideParentheses = (): boolean => {
    const openCount = (textUntilPosition.match(/\(/g) || []).length;
    const closeCount = (textUntilPosition.match(/\)/g) || []).length;

    return openCount > closeCount;
  };

  // Check if we're inside label matching braces
  const inLabelMatcher = (): boolean => {
    const openCount = (textUntilPosition.match(/{/g) || []).length;
    const closeCount = (textUntilPosition.match(/}/g) || []).length;

    return openCount > closeCount;
  };

  // Check if we're after a label inside braces (for comparator suggestions)
  const isAfterLabelInBraces = (): boolean => {
    if (!inLabelMatcher()) {
      return false;
    }
    const lastOpenBrace = textUntilPosition.lastIndexOf('{');
    const textInBraces = textUntilPosition.slice(lastOpenBrace);

    return /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(textInBraces);
  };

  // Check if we're inside square brackets
  const isInsideTimeRange = (): boolean => {
    const lastOpenBracket = textUntilPosition.lastIndexOf('[');
    if (lastOpenBracket === -1) {
      return false;
    }

    const closeAfterOpen = textUntilPosition.indexOf(']', lastOpenBracket);

    return closeAfterOpen === -1;
  };

  // Check if we're at the query start or after certain delimiters
  const atQueryStart =
    textUntilPosition.trim() === '' ||
    textUntilPosition.trim().endsWith('(') ||
    /[\s,]$/.test(textUntilPosition) ||
    position === 0 ||
    isStartingWord;

  // Check if we're between vectors (for binary operators)
  const isBetweenVectors = (): boolean => {
    const prevText = textUntilPosition.trim();

    return /}$|\)$/.test(prevText);
  };

  // Inside grouping operator parentheses (by/without)
  if (isAfterGroupOperator()) {
    return {
      type: 'label',
      context: 'grouping'
    };
  }

  // Time range after [
  if (isInsideTimeRange()) {
    return { type: 'time-range' };
  }

  // Inside label matcher braces {}
  if (inLabelMatcher()) {
    if (isAfterLabelInBraces()) {
      return { type: 'comparator' };
    }

    return {
      type: 'label',
      context: findCurrentMetric(text)
    };
  }

  // After complete aggregation - both grouping and binary operators
  if (isAfterCompleteAggregation()) {
    return {
      type: 'grouping-and-binary',
      context: 'after_complete_aggregation'
    };
  }

  // After aggregation function (both immediate and complete)
  if (isAfterAggregation()) {
    return {
      type: 'grouping-operator',
      context: 'after_aggregation'
    };
  }

  // Between vector results
  if (isBetweenVectors()) {
    return {
      type: 'binary-operator',
      context: 'between_vectors'
    };
  }

  // At query start or inside general parentheses
  if (atQueryStart || insideParentheses()) {
    return {
      type: 'function-or-metric',
      context: atQueryStart ? 'start_of_query' : 'inside_parenthesis'
    };
  }

  return { type: 'any' };
};
