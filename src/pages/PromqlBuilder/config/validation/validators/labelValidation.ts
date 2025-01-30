/**
 * Checks if the query has valid label matchers within curly braces.
 */
export const hasValidLabelMatchers = (query: string): { isValid: boolean; position?: number } => {
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
