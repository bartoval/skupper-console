import { TokenAnalysis } from '../../../types/PromBuilder.interfaces';
import { PROMETHEUS_DICTIONARY } from '../config/Dictionary';

// --- Helper Functions for Context Detection ---

/**
 * Checks if the cursor is inside parentheses
 */
const isInsideParentheses = (text: string): boolean => {
  const openCount = (text.match(/\(/g) || []).length;
  const closeCount = (text.match(/\)/g) || []).length;

  return openCount > closeCount;
};

/**
 * Checks if the cursor is after an aggregation operator
 */
const isAfterAggregation = (text: string): boolean => {
  const trimmedText = text.trim();

  return PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => trimmedText.endsWith(agg));
};

/**
 * Checks if we have a complete aggregation expression
 */
const isAfterCompleteAggregation = (text: string): boolean =>
  PROMETHEUS_DICTIONARY.operators.aggregation.operators.some((agg) => {
    const pattern = new RegExp(`${agg}\\s*\\([^)]*\\)`);

    return pattern.test(text.trim());
  });

/**
 * Checks if we're after a grouping operator (by/without)
 */
const isAfterGroupOperator = (text: string): boolean => {
  const groupMatch = text.match(/(?:by|without)\s*\(([^)]*)?$/);

  return !!groupMatch;
};

/**
 * Checks if we're inside a label matcher block
 */
const isInLabelMatcher = (text: string): boolean => {
  const openCount = (text.match(/{/g) || []).length;
  const closeCount = (text.match(/}/g) || []).length;

  return openCount > closeCount;
};

/**
 * Checks if we're after a label name inside braces
 */
const isAfterLabelInBraces = (text: string): boolean => {
  if (!isInLabelMatcher(text)) {
    return false;
  }

  const lastOpenBrace = text.lastIndexOf('{');
  const textInBraces = text.slice(lastOpenBrace);

  return /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(textInBraces);
};

/**
 * Checks if we're inside a time range expression
 */
const isInsideTimeRange = (text: string): boolean => {
  const lastOpenBracket = text.lastIndexOf('[');
  if (lastOpenBracket === -1) {
    return false;
  }

  const closeAfterOpen = text.indexOf(']', lastOpenBracket);

  return closeAfterOpen === -1;
};

/**
 * Checks if we're inside a subquery expression
 */
const isInsideSubquery = (text: string): boolean => {
  const lastColon = text.lastIndexOf(':');
  if (lastColon === -1) {
    return false;
  }

  const lastOpenBracket = text.lastIndexOf('[', lastColon);
  const lastCloseBracket = text.lastIndexOf(']', lastColon);

  return lastOpenBracket > lastCloseBracket;
};

/**
 * Checks if we're between vector results
 */
const isBetweenVectors = (text: string): boolean => {
  const prevText = text.trim();

  return /}$|\)$/.test(prevText);
};

/**
 * Checks if we're at the start of a query or word
 */
const isAtQueryStart = (text: string, position: number, isStartingWord: boolean): boolean =>
  text.trim() === '' || text.trim().endsWith('(') || /[\s,]$/.test(text) || position === 0 || isStartingWord;

const isAfterMetric = (text: string): boolean => {
  const trimmedText = text.trim();
  const isMetric = PROMETHEUS_DICTIONARY.metrics.some((metric) => trimmedText.endsWith(metric));

  // abel matcher
  const isAfterMatcher = /\}\s*$/.test(trimmedText);

  // unction or subquery
  const isAfterFunction = /\)\s*$/.test(trimmedText);

  return isMetric || isAfterMatcher || isAfterFunction;
};

/**
 * Finds the first matching metric in the text
 */
const findFirstMatchingMetric = (text: string): string | undefined =>
  PROMETHEUS_DICTIONARY.metrics.find((metric) => text.includes(metric));

// --- Context Analysis Functions ---

/**
 * Analyzes the binary operator context and determines the appropriate subtype
 */
const analyzeBinaryOperatorContext = (text: string): TokenAnalysis => {
  const prevTokens = text.trim().split(/\s+/);
  const lastToken = prevTokens[prevTokens.length - 1];

  // Determine operator subtype based on context
  if (/^\d+$/.test(lastToken)) {
    return {
      type: 'binary-operator',
      context: 'between_vectors',
      subType: 'arithmetic'
    };
  }

  if (lastToken.endsWith('> bool') || lastToken.endsWith('< bool')) {
    return {
      type: 'binary-operator',
      context: 'between_vectors',
      subType: 'set'
    };
  }

  // Check if we're in a comparison context
  if (/[0-9.]$/.test(lastToken)) {
    return {
      type: 'binary-operator',
      context: 'between_vectors',
      subType: 'comparison'
    };
  }

  return {
    type: 'binary-operator',
    context: 'between_vectors'
  };
};

/**
 * Analyzes grouping operator context
 */
const analyzeGroupingOperatorContext = (): TokenAnalysis => ({
  type: 'label',
  context: 'grouping'
});

/**
 * Analyzes time range context
 */
const analyzeTimeRangeContext = (text: string): TokenAnalysis => {
  // Check if we're in a subquery context
  const lastColon = text.lastIndexOf(':');
  const lastOpenBracket = text.lastIndexOf('[');

  if (lastColon > lastOpenBracket) {
    return {
      type: 'subquery',
      context: 'inside_subquery'
    };
  }

  return {
    type: 'time-range'
  };
};

/**
 * Analyzes label matcher context
 */
const analyzeLabelMatcherContext = (text: string): TokenAnalysis => {
  if (isAfterLabelInBraces(text)) {
    return { type: 'comparator' };
  }

  return {
    type: 'label',
    context: findFirstMatchingMetric(text)
  };
};

/**
 * Analyzes aggregation context
 */
const analyzeAggregationContext = (): TokenAnalysis => ({
  type: 'grouping-and-binary',
  context: 'after_complete_aggregation'
});

/**
 * Analyzes aggregation operator context
 */
const analyzeAggregationOperatorContext = (): TokenAnalysis => ({
  type: 'grouping-operator',
  context: 'after_aggregation'
});

const analyzeMetricContext = (): TokenAnalysis => ({
  type: 'operator',
  context: 'after_metric',
  subType: 'any'
});

/**
 * Main token analysis function
 */
export const getTokenType = (text: string, position: number): TokenAnalysis => {
  const textUntilPosition = text.substring(0, position);
  const currentWord = textUntilPosition.trim();
  const isStartingWord = /^[a-zA-Z]*$/.test(currentWord);

  // Check for subquery context
  if (isInsideSubquery(textUntilPosition)) {
    return {
      type: 'subquery',
      context: 'inside_subquery'
    };
  }

  // Check if we're after a metric or label matcher
  if (isAfterMetric(textUntilPosition)) {
    return analyzeMetricContext();
  }

  // Inside grouping operator parentheses
  if (isAfterGroupOperator(textUntilPosition)) {
    return analyzeGroupingOperatorContext();
  }

  // Time range or subquery after [
  if (isInsideTimeRange(textUntilPosition)) {
    return analyzeTimeRangeContext(textUntilPosition);
  }

  // Inside label matcher braces
  if (isInLabelMatcher(textUntilPosition)) {
    return analyzeLabelMatcherContext(textUntilPosition);
  }

  // After complete aggregation
  if (isAfterCompleteAggregation(textUntilPosition)) {
    return analyzeAggregationContext();
  }

  // After aggregation function
  if (isAfterAggregation(textUntilPosition)) {
    return analyzeAggregationOperatorContext();
  }

  // Between vector results
  if (isBetweenVectors(textUntilPosition)) {
    return analyzeBinaryOperatorContext(textUntilPosition);
  }

  // At query start or inside parentheses
  if (isAtQueryStart(textUntilPosition, position, isStartingWord) || isInsideParentheses(textUntilPosition)) {
    return {
      type: 'function-or-metric',
      context: isAtQueryStart(textUntilPosition, position, isStartingWord) ? 'start_of_query' : 'inside_parenthesis'
    };
  }

  // Default case
  return { type: 'any' };
};
