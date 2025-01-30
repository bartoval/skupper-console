import { getBinaryOperatorSuggestions } from './suggestions/getBinaryOperatorSuggestions';
import { getComparatorSuggestions } from './suggestions/getComparatorSuggestions';
import { getFunctionOrMetricSuggestions } from './suggestions/getFunctionMetricSuggestions';
import { getGroupingOperatorSuggestions } from './suggestions/getGroupingOperatorSuggestions';
import { getLabelSuggestions } from './suggestions/getLabelSuggestions';
import { getTimeUnitSuggestions } from './suggestions/getTimeUnitSuggestions';
import {
  SuggestionProviderFunction,
  TokenTypeToParamsMap,
  TokenTypeToPropsMap
} from '../../../../types/PromBuilder.interfaces';

/**
 * Configuration mapping TokenTypes to their respective SuggestionProviders.
 */

export const tokenTypeConfig: { [K in keyof TokenTypeToPropsMap]: SuggestionProviderFunction<TokenTypeToPropsMap[K]> } =
  {
    label: getLabelSuggestions,
    comparator: getComparatorSuggestions,
    'time-range': getTimeUnitSuggestions,
    'grouping-operator': getGroupingOperatorSuggestions,
    'binary-operator': getBinaryOperatorSuggestions,
    'function-or-metric': getFunctionOrMetricSuggestions
    // string: async () => [], // No suggestions
    // number: async () => [],
    // operator: async () => [],
    // keyword: async () => [],
    // comment: async () => [],
    // variable: async () => [],
    // 'template-parameter': async () => [],
  };

export const tokenTypeToParams: TokenTypeToParamsMap = {
  label: (range, tokenType) => ({ range, tokenType }),
  comparator: (range, tokenType) => ({ range, tokenType }),
  'time-range': (_, tokenType, textUntilPosition, position) => ({ tokenType, textUntilPosition, position }),
  'grouping-operator': (range, tokenType) => ({ range, tokenType }),
  'binary-operator': (range, tokenType) => ({ range, tokenType }),
  'function-or-metric': (range, tokenType) => ({ range, tokenType })
};
