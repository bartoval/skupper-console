import { FC, useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { RESTApi } from '@API/REST';
import { UPDATE_INTERVAL } from '@config/config';
import { GraphNode } from '@core/components/Graph/Graph.interfaces';
import GraphReactAdaptor from '@core/components/Graph/GraphReactAdaptor';
import { ProcessGroupsRoutesPaths } from '@pages/ProcessGroups/ProcessGroups.enum';
import { QueriesProcessGroups } from '@pages/ProcessGroups/services/services.enum';
import LoadingPage from '@pages/shared/Loading';

import { TopologyController } from '../services';
import { QueriesTopology } from '../services/services.enum';

const processGroupsQueryParams = {
  processGroupRole: 'external'
};

const TopologyProcessGroups: FC<{ id?: string }> = function ({ id: processGroupId }) {
  const navigate = useNavigate();

  const { data: processGroups, isLoading: isLoadingProcessGroups } = useQuery(
    [QueriesProcessGroups.GetProcessGroups, processGroupsQueryParams],
    () => RESTApi.fetchProcessGroups(processGroupsQueryParams),
    {
      refetchInterval: UPDATE_INTERVAL
    }
  );

  const { data: processGroupsPairs, isLoading: isLoadingProcessGroupsPairs } = useQuery(
    [QueriesTopology.GetProcessGroupsLinks],
    () => RESTApi.fetchProcessgroupsPairs(),
    {
      refetchInterval: UPDATE_INTERVAL
    }
  );

  const handleGetSelectedNode = useCallback(
    ({ id, label }: GraphNode) => {
      navigate(`${ProcessGroupsRoutesPaths.ProcessGroups}/${label}@${id}`);
    },
    [navigate]
  );

  if (isLoadingProcessGroups || isLoadingProcessGroupsPairs) {
    return <LoadingPage />;
  }

  if (!processGroups || !processGroupsPairs) {
    return null;
  }

  const nodes = TopologyController.convertProcessGroupsToNodes(processGroups);
  const links = TopologyController.convertProcessPairsToLinks(processGroupsPairs);

  return (
    <GraphReactAdaptor nodes={nodes} edges={links} onClickNode={handleGetSelectedNode} itemSelected={processGroupId} />
  );
};

export default TopologyProcessGroups;
