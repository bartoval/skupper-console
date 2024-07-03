import { ChartThemeColor } from '@patternfly/react-charts';
import { Card, CardBody, CardTitle, Grid, GridItem, Title, TitleSizes } from '@patternfly/react-core';
import { useSuspenseQueries } from '@tanstack/react-query';

import { PrometheusApi } from '@API/Prometheus.api';
import { decomposePrometheusSiteLabel, getTimeSeriesFromPrometheusData } from '@API/Prometheus.utils';
import { RESTApi } from '@API/REST.api';
import { Direction } from '@API/REST.enum';
import { UPDATE_INTERVAL } from '@config/config';
import { calculateStep } from '@config/prometheus';
import { getTestsIds } from '@config/testIds';
import SkChartArea from '@core/components/SkChartArea';
import SkTable from '@core/components/SkTable';
import { formatByteRate } from '@core/utils/formatBytes';
import { formatToDecimalPlacesIfCents } from '@core/utils/formatToDecimalPlacesIfCents';
import MainContainer from '@layout/MainContainer';
import { CustomProcessPairCells } from '@pages/Processes/Processes.constants';
import { ProcessesLabels, QueriesProcesses } from '@pages/Processes/Processes.enum';
import { ComponentLabels, QueriesComponent } from '@pages/ProcessGroups/ProcessGroups.enum';
import { QueriesServices, ServicesLabels } from '@pages/Services/Services.enum';
import { QueriesSites, SiteLabels } from '@pages/Sites/Sites.enum';
import { TopologyRoutesPaths, TopologyViews } from '@pages/Topology/Topology.enum';

import { DashboardLabels } from '../Dashboard.enum';

const initComponentsQueryParams = {
  processGroupRole: ['remote', 'external']
};

const initProcessessQueryParams = {
  processRole: ['remote', 'external']
};

const InventoryColumns: any = [
  {
    name: 'Site',
    prop: 'name'
  },

  {
    name: 'Routers',
    prop: 'routers'
  },
  {
    name: 'Remote links',
    prop: 'links'
  }
];

const currentSiteColumns: any = [
  {
    name: 'Site',
    prop: 'name'
  },
  {
    name: 'byterate',
    prop: 'byteRate',
    customCellName: 'ByteRateFormatCell',
    modifier: 'fitContent'
  }
];

const Dashboard = function () {
  const end = new Date().getTime() / 1000;
  const start = end - 60;
  const [
    { data: sites },
    { data: routers },
    { data: links },
    { data: components },
    { data: processes },
    { data: services },
    { data: clientErrorCount },
    { data: serverErrorCount },
    { data: siteTrafficOut },
    { data: siteTrafficIn }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: [QueriesSites.GetSites],
        queryFn: () => RESTApi.fetchSites(),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: [QueriesSites.GetRouters],
        queryFn: () => RESTApi.fetchRouters(),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: [QueriesSites.GetLinks],
        queryFn: () => RESTApi.fetchLinks(),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: [QueriesComponent.GetProcessGroups, initComponentsQueryParams],
        queryFn: () => RESTApi.fetchProcessGroups(initComponentsQueryParams)
      },
      {
        queryKey: [QueriesProcesses.GetProcesses, initProcessessQueryParams],
        queryFn: () => RESTApi.fetchProcesses(initProcessessQueryParams),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: [QueriesServices.GetServices],
        queryFn: () => RESTApi.fetchServices(),
        refetchInterval: UPDATE_INTERVAL
      },

      {
        queryKey: ['QueriesServices.clientErrorCount'],
        queryFn: () =>
          PrometheusApi.fetchResponseCountsByPartialCodeInTimeRange({
            start,
            end,
            step: calculateStep(end - start),
            code: '4.*'
          }),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: ['QueriesServices.serverErrorCount'],
        queryFn: () =>
          PrometheusApi.fetchResponseCountsByPartialCodeInTimeRange({
            start,
            end,
            step: calculateStep(end - start),
            code: '5.*'
          }),
        refetchInterval: UPDATE_INTERVAL
      },

      {
        queryKey: ['QueriesServices.Tx'],
        queryFn: () =>
          PrometheusApi.fetchByteRateByDirectionInTimeRange({
            start,
            end,
            step: calculateStep(end - start),
            groupBy: 'sourceSite',
            limit: 10,
            direction: Direction.Incoming
          }),
        refetchInterval: UPDATE_INTERVAL
      },
      {
        queryKey: ['QueriesServices.Rx'],
        queryFn: () =>
          PrometheusApi.fetchByteRateByDirectionInTimeRange({
            start,
            end,
            step: calculateStep(end - start),
            groupBy: 'destSite',
            limit: 10,
            direction: Direction.Incoming
          }),
        refetchInterval: UPDATE_INTERVAL
      }
    ]
  });

  const routerMap = routers.reduce(
    (acc, router) => {
      acc[router.parent] = (acc[router.parent] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const linkMap = links
    .filter((link) => link.direction === Direction.Outgoing)
    .reduce(
      (acc, link) => {
        acc[link.sourceSiteId] = (acc[link.sourceSiteId] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

  const clientErrorCountData = getTimeSeriesFromPrometheusData(clientErrorCount);
  const serverErrorCountData = getTimeSeriesFromPrometheusData(serverErrorCount);

  const siteDataOut = getTimeSeriesFromPrometheusData(siteTrafficOut);
  const siteDataIn = getTimeSeriesFromPrometheusData(siteTrafficIn);

  const txLabels = siteDataOut?.labels.map((label) => decomposePrometheusSiteLabel(label) || '');
  const rxLabels = siteDataIn?.labels.map((label) => decomposePrometheusSiteLabel(label) || '');

  const currentTxValues = siteDataOut?.values?.map((v, index) => ({
    name: txLabels?.[index],
    byteRate: v[v.length - 1]?.y
  }));

  const currentRxValues = siteDataIn?.values?.map((v, index) => ({
    name: rxLabels?.[index],
    byteRate: v[v.length - 1]?.y
  }));

  const currentSiteValues = sites?.map((site) => ({
    name: site.name,
    routers: routerMap[site.identity] || 0,
    links: linkMap[site.identity] || 0
  }));

  const randomArray2 = siteDataIn?.values[0]?.map((v, index) => ({
    x: v.x,
    y: index === 5 ? 2 : 0
  }));

  const randomArray = siteDataIn?.values[0]?.map((v) => ({
    x: v.x,
    y: 0
  }));

  return (
    <MainContainer
      dataTestId={getTestsIds.processesView()}
      title={DashboardLabels.Section}
      link={`${TopologyRoutesPaths.Topology}?type=${TopologyViews.Processes}`}
      mainContentChildren={
        <Grid hasGutter className="pf-v5-u-text-align-center">
          <GridItem span={3}>
            <Card>
              <CardTitle>
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {sites.length}
                </Title>
              </CardTitle>
              <CardBody>{SiteLabels.Section}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={3}>
            <Card>
              <CardTitle>
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {components.results.length}
                </Title>
              </CardTitle>
              <CardBody>{ComponentLabels.Section}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={3}>
            <Card>
              <CardTitle>
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {processes.results.length}
                </Title>
              </CardTitle>
              <CardBody>{ProcessesLabels.Section}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={3}>
            <Card>
              <CardTitle>
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {services.results.length}
                </Title>
              </CardTitle>
              <CardBody>{ServicesLabels.Section}</CardBody>
            </Card>
          </GridItem>

          <GridItem span={12}>
            <SkTable
              isFullHeight
              alwaysShowPagination={false}
              title={'Site'}
              columns={InventoryColumns}
              rows={currentSiteValues}
              pagination={true}
              paginationPageSize={5}
            />
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardTitle color="red">
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {clientErrorCountData?.values[0].length || 0}
                </Title>
              </CardTitle>
              <CardBody>{'Http Client errors'}</CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h1" size={TitleSizes['4xl']}>
                  {2 || serverErrorCountData?.values[0].length}
                </Title>
              </CardTitle>
              <CardBody>{'Http Server errors'}</CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardBody>
                <SkChartArea
                  formatY={(y: number) => formatToDecimalPlacesIfCents(y, 3)}
                  legendLabels={[`4XX errr rate`]}
                  data={[randomArray || [{ x: 0, y: 0 }]]}
                  themeColor={ChartThemeColor.gold}
                />
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardBody>
                <SkChartArea
                  formatY={(y: number) => formatToDecimalPlacesIfCents(y, 3)}
                  legendLabels={[`5XX errr rate`]}
                  data={[randomArray2 || [{ x: 0, y: 0 }]]}
                  themeColor={ChartThemeColor.orange}
                />
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <SkTable
              isFullHeight
              alwaysShowPagination={false}
              title={'Top 10 Rx Byterate'}
              columns={currentSiteColumns}
              rows={currentTxValues}
              pagination={false}
              customCells={CustomProcessPairCells}
            />
          </GridItem>

          <GridItem span={6}>
            <SkTable
              isFullHeight
              alwaysShowPagination={false}
              title={'Top 10 Tx byterate'}
              columns={currentSiteColumns}
              rows={currentRxValues}
              pagination={false}
              customCells={CustomProcessPairCells}
            />
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4">{'Top 10 Rx Byterate in the last minute'}</Title>
              </CardTitle>
              <CardBody>
                <SkChartArea
                  isChartLine={true}
                  formatY={formatByteRate}
                  themeColor={ChartThemeColor.multi}
                  legendLabels={txLabels}
                  data={siteDataOut?.values || []}
                />
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4">{'Top 10 Tx Byterate in the last minute'}</Title>
              </CardTitle>
              <CardBody>
                <SkChartArea
                  isChartLine={true}
                  formatY={formatByteRate}
                  themeColor={ChartThemeColor.multiUnordered}
                  legendLabels={rxLabels}
                  data={siteDataIn?.values || []}
                />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      }
    />
  );
};

export default Dashboard;
