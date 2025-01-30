import { TIME_UNITS } from '../../../PromqlBuilder.constants';

/**
 * Checks if the query has a valid time range specified within square brackets.
 */
export const hasValidTimeRange = (query: string): { isValid: boolean; position?: number } => {
  // Look for a pattern like [number+unit]
  const timeRangeRegex = /\[(\d+[smhdwy])\]/;
  const matches = query.match(timeRangeRegex);

  if (!matches) {
    // Find the position of the opening square bracket
    const openBracket = query.indexOf('[');

    return {
      isValid: false,
      position: openBracket > -1 ? openBracket : undefined
    };
  }

  // Verify that the time unit is valid
  const timeUnit = matches[1].slice(-1);
  if (!TIME_UNITS.some((unit) => unit.value === timeUnit)) {
    return {
      isValid: false,
      position: matches.index
    };
  }

  return { isValid: true };
};
