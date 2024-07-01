import { lazy } from 'react';

import { DashboardRoutesPaths } from './Dashboard.enum';

const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './views/Dashboard'));

export const dashboardRoutes = [
  {
    path: DashboardRoutesPaths.Dashboard,
    element: <Dashboard />
  }
];
