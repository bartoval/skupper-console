/**
 * Checks if the query has a valid binary expression (e.g., metric1 + metric2).
 */
export const hasValidBinaryExpression = (query: string): { isValid: boolean; position?: number } => {
  const binaryRegex = /[\w_]+\s*[+\-*/%^]\s*[\w_]+/;
  const match = query.match(binaryRegex);

  return {
    isValid: Boolean(match),
    position: match?.index
  };
};

/**
 * Checks if the query contains any binary operators (+, -, *, /, %, ^).
 */
export const hasBinaryOperators = (query: string): boolean => {
  const binaryRegex = /[+\-*/%^]/;

  return binaryRegex.test(query);
};
