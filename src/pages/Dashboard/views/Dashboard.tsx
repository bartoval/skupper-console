import { startTransition, useCallback, useState } from 'react';

import { useSuspenseQuery } from '@tanstack/react-query';

import { RESTApi } from '@API/REST.api';
import { RemoteFilterOptions } from '@API/REST.interfaces';
import { BIG_PAGINATION_SIZE, UPDATE_INTERVAL } from '@config/config';
import { getTestsIds } from '@config/testIds';
import SkTable from '@core/components/SkTable';
import MainContainer from '@layout/MainContainer';
import { CustomProcessCells, processesTableColumns } from '@pages/Processes/Processes.constants';
import { QueriesProcesses } from '@pages/Processes/Processes.enum';
import { TopologyRoutesPaths, TopologyViews } from '@pages/Topology/Topology.enum';

import { DashboardLabels } from '../Dashboard.enum';

const initProcessesQueryParams = {
  limit: BIG_PAGINATION_SIZE,
  processRole: ['remote', 'external'],
  endTime: 0
};

const Dashboard = function () {
  const [externalProcessesQueryParams, setExternalProcessesQueryParams] =
    useState<RemoteFilterOptions>(initProcessesQueryParams);

  const { data: processData } = useSuspenseQuery({
    queryKey: [QueriesProcesses.GetProcessesPaginated, externalProcessesQueryParams],
    queryFn: () => RESTApi.fetchProcesses(externalProcessesQueryParams),
    refetchInterval: UPDATE_INTERVAL
  });

  const handleGetFilters = useCallback((params: RemoteFilterOptions) => {
    startTransition(() => {
      setExternalProcessesQueryParams((previousQueryParams) => ({ ...previousQueryParams, ...params }));
    });
  }, []);

  const processes = processData?.results || [];
  const processesCount = processData?.timeRangeCount || 0;

  return (
    <MainContainer
      dataTestId={getTestsIds.processesView()}
      title={DashboardLabels.Section}
      link={`${TopologyRoutesPaths.Topology}?type=${TopologyViews.Processes}`}
      mainContentChildren={
        <SkTable
          columns={processesTableColumns}
          rows={processes}
          customCells={CustomProcessCells}
          pagination={true}
          paginationTotalRows={processesCount}
          paginationPageSize={BIG_PAGINATION_SIZE}
          onGetFilters={handleGetFilters}
        />
      }
    />
  );
};

export default Dashboard;
