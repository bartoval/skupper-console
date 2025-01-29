import { lazy } from 'react';

import { PromqlBuilderRoutesPaths } from '../pages/PromqlBuilder/PromqlBuilder.enum';

const PromqlBuilder = lazy(
  () => import(/* webpackChunkName: "promqlBuilder" */ '../pages/PromqlBuilder/view/PromqlBuilder')
);

export const PromqlBuilderRoutes = [
  {
    path: PromqlBuilderRoutesPaths.PromqlBuilder,
    element: <PromqlBuilder />
  }
];
