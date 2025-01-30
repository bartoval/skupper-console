import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Checks if the query has a valid aggregation expression.
 * An aggregation expression consists of an aggregation operator (e.g., sum, avg)
 * followed by parentheses containing the expression to aggregate.
 */
export const hasValidAggregation = (query: string): { isValid: boolean; position?: number } => {
  const aggRegex = new RegExp(`(${PROMETHEUS_DICTIONARY.getAggregators().join('|')})\\s*\\([^)]*\\)`, 'i');
  const match = query.match(aggRegex);

  return {
    isValid: Boolean(match),
    position: match?.index
  };
};
