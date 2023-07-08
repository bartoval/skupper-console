import { FC, useCallback } from 'react';

import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { ListIcon } from '@patternfly/react-icons';
import { NodeModel, Point } from '@patternfly/react-topology';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { RESTApi } from '@API/REST.api';
import { UPDATE_INTERVAL } from '@config/config';
import TopologyAdaptor from '@core/components/Graph/TopologyAdaptor';
import LoadingPage from '@pages/shared/Loading';
import { QueriesSites } from '@pages/Sites/services/services.enum';
import { SitesRoutesPaths } from '@pages/Sites/Sites.enum';

import { TopologyController } from '../services';
import { Labels } from '../Topology.enum';

const ZOOM_CACHE_KEY = 'site-graphZoom';
const POSITIONS_CACHE_KEY = 'site-graphPositions';

const TopologySite: FC<{ id?: string | null }> = function () {
  const navigate = useNavigate();

  const { data: sites, isLoading: isLoadingSites } = useQuery([QueriesSites.GetSites], () => RESTApi.fetchSites(), {
    refetchInterval: UPDATE_INTERVAL
  });

  const { data: routers, isLoading: isLoadingRouters } = useQuery(
    [QueriesSites.GetRouters],
    () => RESTApi.fetchRouters(),
    {
      refetchInterval: UPDATE_INTERVAL
    }
  );

  const { data: links, isLoading: isLoadingLinks } = useQuery([QueriesSites.GetLinks], () => RESTApi.fetchLinks(), {
    refetchInterval: UPDATE_INTERVAL
  });

  const handleSaveZoom = useCallback((zoomValue: number, positions: Point) => {
    localStorage.setItem(ZOOM_CACHE_KEY, `${zoomValue}`);
    localStorage.setItem(POSITIONS_CACHE_KEY, JSON.stringify(positions));
  }, []);

  const handleGetSelectedNode = useCallback(
    ({ id, label }: NodeModel) => {
      navigate(`${SitesRoutesPaths.Sites}/${label}@${id}`);
    },
    [navigate]
  );

  if (isLoadingSites || isLoadingLinks || isLoadingRouters) {
    return <LoadingPage />;
  }

  if (!links || !routers || !sites) {
    return null;
  }

  const nodes = TopologyController.convertSitesToNodes(sites);
  const siteLinks = TopologyController.getLinksFromSites(sites, routers, links);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup alignment={{ default: 'alignRight' }}>
            <ToolbarItem>
              <Link to={SitesRoutesPaths.Sites}>
                <Tooltip content={Labels.TableView}>
                  <ListIcon />
                </Tooltip>
              </Link>
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      <TopologyAdaptor
        nodes={nodes}
        edges={siteLinks}
        onClickNode={handleGetSelectedNode}
        onGetZoom={handleSaveZoom}
        config={{
          zoom: localStorage.getItem(ZOOM_CACHE_KEY)
        }}
      />
    </>
  );
};

export default TopologySite;
