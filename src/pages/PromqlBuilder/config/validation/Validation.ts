import { editor, MarkerSeverity } from 'monaco-editor';

import { PromQLError, ValidationErrorDefinition } from '../../../../types/PromBuilder.interfaces';
import { LANGUAGE_ID } from '../../PromqlBuilder.constants';
import { hasValidAggregation } from './validators/AggregationExpressionValidation';
import { hasBinaryOperators, hasValidBinaryExpression } from './validators/binaryExpressionValidation';
import { hasBalancedBrackets } from './validators/bracketValidation';
import { hasValidRateUsage } from './validators/functionValidation';
import { hasValidLabelMatchers } from './validators/labelValidation';
import { hasValidMetricNames } from './validators/metricValidation';
import { hasValidStringFormat } from './validators/stringValidation';
import { hasValidTimeRange } from './validators/timeRagenValidation';

// --- Error Messages ---
const ERROR_MESSAGES = {
  EMPTY_QUERY: 'Query cannot be empty',
  UNBALANCED_BRACKETS: 'Brackets are not balanced',
  MISSING_METRIC: 'Query must contain at least one valid metric name',
  INVALID_TIME_RANGE: 'Invalid time range format',
  INVALID_LABEL_MATCHER: 'Invalid label matcher syntax',
  INVALID_BINARY_EXPRESSION: 'Invalid binary expression',
  INVALID_RATE_USAGE: 'Function "rate" requires a range vector parameter (e.g., [1m])',
  INVALID_AGGREGATION: 'Invalid aggregation expression',
  INVALID_STRING_FORMAT: 'Invalid string format. PromQL strings must use double quotes ("")'
};

// This array defines the validation rules to be applied to the PromQL query.
const validationErrorDefinitions: ValidationErrorDefinition[] = [
  {
    validationFunction: hasBalancedBrackets,
    message: ERROR_MESSAGES.UNBALANCED_BRACKETS
  },
  {
    validationFunction: hasValidMetricNames,
    message: ERROR_MESSAGES.MISSING_METRIC
  },
  {
    validationFunction: hasValidTimeRange,
    message: ERROR_MESSAGES.INVALID_TIME_RANGE,
    includeCondition: (query) => query.includes('[') // Only validate if the query contains '['
  },
  {
    validationFunction: hasValidLabelMatchers,
    message: ERROR_MESSAGES.INVALID_LABEL_MATCHER,
    includeCondition: (query) =>
      // Skip validation if the query contains '{' AND the label_replace pattern
      query.includes('{') && !/label_replace\([^)]*\)/.test(query)
  },
  {
    validationFunction: hasValidBinaryExpression,
    message: ERROR_MESSAGES.INVALID_BINARY_EXPRESSION,
    includeCondition: hasBinaryOperators // Only validate if binary operators are present
  },
  {
    validationFunction: hasValidRateUsage,
    message: ERROR_MESSAGES.INVALID_RATE_USAGE,
    includeCondition: (query) => query.includes('rate(') // Only validate if the query contains 'rate('
  },
  {
    validationFunction: hasValidAggregation,
    message: ERROR_MESSAGES.INVALID_AGGREGATION
  },
  {
    validationFunction: hasValidStringFormat,
    message: ERROR_MESSAGES.INVALID_STRING_FORMAT
  }
];

/**
 * Validates the PromQL query by running a series of checks and collecting any errors.
 */
export const validatePromQLWithPositions = (query: string): PromQLError[] => {
  const errors: PromQLError[] = [];

  if (!query.trim()) {
    errors.push({
      message: ERROR_MESSAGES.EMPTY_QUERY,
      startPosition: 0,
      endPosition: 0
    });

    return errors;
  }

  for (const validation of validationErrorDefinitions) {
    if (validation.includeCondition && !validation.includeCondition(query)) {
      continue; // Skip this validation if the condition is not met
    }

    const result = validation.validationFunction(query);
    if (!result.isValid && result.position !== undefined) {
      const endPosition = result.position + 1; // Default length: one character
      let adjustedEndPosition = endPosition;

      // Add specific logic to calculate the correct endPosition
      // (e.g., for time range and label matchers)
      if (validation.message === ERROR_MESSAGES.INVALID_TIME_RANGE) {
        adjustedEndPosition = result.position + query.substring(result.position).indexOf(']') + 1;
      } else if (validation.message === ERROR_MESSAGES.INVALID_LABEL_MATCHER) {
        adjustedEndPosition = result.position + query.substring(result.position).indexOf('}') + 1;
      } else if (validation.message === ERROR_MESSAGES.INVALID_RATE_USAGE) {
        adjustedEndPosition = query.indexOf(')', result.position) + 1;
      }

      errors.push({
        message: validation.message,
        startPosition: result.position,
        endPosition: adjustedEndPosition
      });
    }
  }

  return errors;
};

/**
 * Applies error markers to the Monaco Editor model based on the validation errors.
 */
export const applyErrorMarkers = (model: editor.ITextModel, errors: PromQLError[]) => {
  const markers: editor.IMarkerData[] = errors.map((error) => ({
    severity: MarkerSeverity.Error,
    message: error.message,
    startLineNumber: 1,
    startColumn: error.startPosition + 1,
    endLineNumber: 1,
    endColumn: error.endPosition + 1
  }));

  editor.removeAllMarkers(LANGUAGE_ID);
  editor.setModelMarkers(model, LANGUAGE_ID, markers);
};
