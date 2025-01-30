import { PromqlBuilderRoutesPaths } from './PromqlBuilder.enum';
import { Labels } from '../../config/labels';

export const PromqlBuilderPaths = {
  path: PromqlBuilderRoutesPaths.PromqlBuilder,
  name: Labels.PromqlBuilder
};

export const LANGUAGE_ID = 'promql';

export const TOKEN_TYPES = {
  AGGREGATOR: 'aggregator',
  FUNCTION: 'function',
  KEYWORD: 'keyword',
  METRIC: 'metric',
  LABEL: 'label',
  NUMBER: 'number',
  STRING: 'string',
  OPERATOR: 'operator',
  DELIMITER: 'delimiter',
  IDENTIFIER: 'identifier'
} as const;

export const TIME_UNITS = [
  { value: 's', description: 'seconds' },
  { value: 'm', description: 'minutes' },
  { value: 'h', description: 'hours' },
  { value: 'd', description: 'days' },
  { value: 'w', description: 'weeks' },
  { value: 'y', description: 'years' }
];
