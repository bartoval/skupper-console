/**
 * Checks if the query has a valid string format (only double quotes allowed).
 */
export const hasValidStringFormat = (query: string): { isValid: boolean; position?: number } => {
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
