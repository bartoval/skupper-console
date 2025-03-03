import { getArithmeticSuggestions } from './suggestions/getArithmeticSuggestions';
import { getBinaryOperatorSuggestions } from './suggestions/getBinaryOperatorSuggestions';
import { getComparatorSuggestions } from './suggestions/getComparatorSuggestions';
import { getFunctionOrMetricSuggestions } from './suggestions/getFunctionMetricSuggestions';
import { getGroupingOperatorSuggestions } from './suggestions/getGroupingOperatorSuggestions';
import { getLabelSuggestions } from './suggestions/getLabelSuggestions';
import { getModifierSuggestions } from './suggestions/getModifierSuggestions';
import { getOperatorSuggestions } from './suggestions/getOperatorSuggestions';
import { getSetOperatorSuggestions } from './suggestions/getSetOperatorSuggestions';
import { getSubquerySuggestions } from './suggestions/getSubquerySuggestions';
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
    'function-or-metric': getFunctionOrMetricSuggestions,
    subquery: getSubquerySuggestions,
    modifier: getModifierSuggestions,
    arithmetic: getArithmeticSuggestions,
    'set-operator': getSetOperatorSuggestions,
    operator: getOperatorSuggestions
  };

export const tokenTypeToParams: TokenTypeToParamsMap = {
  label: (range, tokenType) => ({ range, tokenType }),
  comparator: (range, tokenType) => ({ range, tokenType }),
  'time-range': (_, tokenType, textUntilPosition, position) => ({ tokenType, textUntilPosition, position }),
  'grouping-operator': (range, tokenType) => ({ range, tokenType }),
  'binary-operator': (range, tokenType) => ({ range, tokenType }),
  'function-or-metric': (range, tokenType) => ({ range, tokenType }),
  subquery: (range, tokenType, textUntilPosition, position) => ({ range, tokenType, textUntilPosition, position }),
  modifier: (range, tokenType) => ({ range, tokenType }),
  arithmetic: (range, tokenType) => ({ range, tokenType }),
  'set-operator': (range, tokenType) => ({ range, tokenType }),
  operator: (range, tokenType) => ({ range, tokenType })
};
