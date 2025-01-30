import { TokenAnalysis } from '../../../types/PromBuilder.interfaces';
import { PROMETHEUS_DICTIONARY } from '../config/Dictionary';

// Find a metric in the text by checking against the available metrics dictionary
const findFirstMatchingMetric = (text: string) => {
  const metrics = PROMETHEUS_DICTIONARY.metrics;

  for (const metric of metrics) {
    if (text.includes(metric)) {
      return metric;
    }
  }

  return undefined;
};

// --- Helper Functions ---

const isInsideParentheses = (text: string): boolean => {
  const openCount = (text.match(/\(/g) || []).length;
  const closeCount = (text.match(/\)/g) || []).length;

  return openCount > closeCount;
};

const isAfterAggregation = (text: string): boolean =>
  PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => text.trim().endsWith(agg));

const isAfterCompleteAggregation = (text: string): boolean =>
  PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => {
    const pattern = new RegExp(`${agg}\\s*\\([^)]*\\)`);

    return pattern.test(text.trim());
  });

const isAfterGroupOperator = (text: string): boolean => {
  const groupMatch = text.match(/(?:by|without)\s*\(([^)]*)?$/);

  return !!groupMatch;
};

const isInLabelMatcher = (text: string): boolean => {
  const openCount = (text.match(/{/g) || []).length;
  const closeCount = (text.match(/}/g) || []).length;

  return openCount > closeCount;
};

const isAfterLabelInBraces = (text: string): boolean => {
  if (!isInLabelMatcher(text)) {
    return false;
  }
  const lastOpenBrace = text.lastIndexOf('{');
  const textInBraces = text.slice(lastOpenBrace);

  return /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(textInBraces);
};

const isInsideTimeRange = (text: string): boolean => {
  const lastOpenBracket = text.lastIndexOf('[');
  if (lastOpenBracket === -1) {
    return false;
  }

  const closeAfterOpen = text.indexOf(']', lastOpenBracket);

  return closeAfterOpen === -1;
};

const isBetweenVectors = (text: string): boolean => {
  const prevText = text.trim();

  return /}$|\)$/.test(prevText);
};

const isAtQueryStart = (text: string, position: number, isStartingWord: boolean): boolean =>
  text.trim() === '' || text.trim().endsWith('(') || /[\s,]$/.test(text) || position === 0 || isStartingWord;

// --- Token Analysis Functions ---

const analyzeGroupingOperatorContext = (): TokenAnalysis => ({
  type: 'label',
  context: 'grouping'
});

const analyzeTimeRangeContext = (): TokenAnalysis => ({
  type: 'time-range'
});

const analyzeLabelMatcherContext = (text: string): TokenAnalysis => {
  if (isAfterLabelInBraces(text)) {
    return { type: 'comparator' };
  }

  return {
    type: 'label',
    context: findFirstMatchingMetric(text)
  };
};

const analyzeAggregationContext = (): TokenAnalysis => ({
  type: 'grouping-and-binary',
  context: 'after_complete_aggregation'
});

const analyzeAggregationOperatorContext = (): TokenAnalysis => ({
  type: 'grouping-operator',
  context: 'after_aggregation'
});

const analyzeVectorContext = (): TokenAnalysis => ({
  type: 'binary-operator',
  context: 'between_vectors'
});

const analyzeDefaultContext = (text: string, position: number, isStartingWord: boolean): TokenAnalysis => ({
  type: 'function-or-metric',
  context: isAtQueryStart(text, position, isStartingWord) ? 'start_of_query' : 'inside_parenthesis'
});

// Analyze the current token context to determine appropriate suggestions
export const getTokenType = (text: string, position: number): TokenAnalysis => {
  const textUntilPosition = text.substring(0, position);
  const currentWord = textUntilPosition.trim();

  // Check if we're starting to type a word
  const isStartingWord = /^[a-zA-Z]*$/.test(currentWord);

  // Inside grouping operator parentheses (by/without)
  if (isAfterGroupOperator(textUntilPosition)) {
    return analyzeGroupingOperatorContext();
  }

  // Time range after [
  if (isInsideTimeRange(textUntilPosition)) {
    return analyzeTimeRangeContext();
  }

  // Inside label matcher braces {}
  if (isInLabelMatcher(textUntilPosition)) {
    return analyzeLabelMatcherContext(textUntilPosition);
  }

  // After complete aggregation - both grouping and binary operators
  if (isAfterCompleteAggregation(textUntilPosition)) {
    return analyzeAggregationContext();
  }

  // After aggregation function (both immediate and complete)
  if (isAfterAggregation(textUntilPosition)) {
    return analyzeAggregationOperatorContext();
  }

  // Between vector results
  if (isBetweenVectors(textUntilPosition)) {
    return analyzeVectorContext();
  }

  // At query start or inside general parentheses
  if (isAtQueryStart(textUntilPosition, position, isStartingWord) || isInsideParentheses(textUntilPosition)) {
    return analyzeDefaultContext(textUntilPosition, position, isStartingWord);
  }

  return { type: 'any' };
};
