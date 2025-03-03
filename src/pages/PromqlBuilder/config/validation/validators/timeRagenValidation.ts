import { TIME_UNITS } from '../../../PromqlBuilder.constants';

/**
 * Validates a time unit against the allowed units
 */
const isValidTimeUnit = (unit: string): boolean => TIME_UNITS.some((validUnit) => validUnit.value === unit);

/**
 * Parses a time value (e.g., "5m", "1h") and validates both number and unit
 */
const isValidTimeValue = (timeValue: string): boolean => {
  const match = timeValue.match(/^(\d+)([smhdwy])$/);
  if (!match) {
    return false;
  }

  const [, , unit] = match;

  return isValidTimeUnit(unit);
};

/**
 * Checks if the query has a valid time range, including subquery syntax support.
 * Valid formats:
 * - Simple range: [5m]
 * - Subquery: [5m:1m]
 */
export const hasValidTimeRange = (query: string): { isValid: boolean; position?: number } => {
  // Find all time range expressions
  const timeRangeRegex = /\[([\d]+[smhdwy](?::[\d]+[smhdwy])?)]/g;
  const matches = Array.from(query.matchAll(timeRangeRegex));

  if (matches.length === 0) {
    // Find the position of any malformed range
    const openBracket = query.indexOf('[');

    return {
      isValid: false,
      position: openBracket > -1 ? openBracket : undefined
    };
  }

  // Check each time range expression
  for (const match of matches) {
    const [, rangeExpr] = match;
    const position = match.index!;

    // Check if it's a subquery
    if (rangeExpr.includes(':')) {
      const [range, step] = rangeExpr.split(':');

      // Validate both range and step
      if (!isValidTimeValue(range) || !isValidTimeValue(step)) {
        return {
          isValid: false,
          position
        };
      }
    } else {
      // Simple time range
      if (!isValidTimeValue(rangeExpr)) {
        return {
          isValid: false,
          position
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Additional helper to specifically validate subquery syntax
 */
export const isValidSubquery = (query: string): { isValid: boolean; position?: number } => {
  const subqueryRegex = /\[([\d]+[smhdwy]):([\d]+[smhdwy])]/g;
  const matches = Array.from(query.matchAll(subqueryRegex));

  for (const match of matches) {
    const [, range, step] = match;
    const position = match.index!;

    // Both range and step must be valid time values
    if (!isValidTimeValue(range) || !isValidTimeValue(step)) {
      return {
        isValid: false,
        position
      };
    }

    // Optional: Add additional validation rules
    // For example, ensure range is larger than step
    const rangeValue = Number(range);
    const stepValue = Number(step);
    const rangeUnit = range.slice(-1);
    const stepUnit = step.slice(-1);

    // Convert both to seconds for comparison
    const rangeSeconds = convertToSeconds(rangeValue, rangeUnit);
    const stepSeconds = convertToSeconds(stepValue, stepUnit);

    if (rangeSeconds <= stepSeconds) {
      return {
        isValid: false,
        position
      };
    }
  }

  return { isValid: true };
};

/**
 * Helper function to convert a time value to seconds
 */
const convertToSeconds = (value: number, unit: string): number => {
  const conversions: { [key: string]: number } = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    y: 31536000
  };

  return value * (conversions[unit] || 0);
};
