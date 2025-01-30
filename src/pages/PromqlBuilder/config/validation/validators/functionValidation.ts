/**
 * Checks if the query incorrectly uses the `rate` function without a range vector.
 */
export const hasValidRateUsage = (query: string): { isValid: boolean; position?: number } => {
  // Look for pattern like rate(<metric>) without range vector
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
