import { ChartThemeColor } from '@patternfly/react-charts';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
  TitleSizes
} from '@patternfly/react-core';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { PrometheusApi } from '@API/Prometheus.api';
import { decomposePrometheusSiteLabel, getTimeSeriesFromPrometheusData } from '@API/Prometheus.utils';
import { RESTApi } from '@API/REST.api';
import { Binding, Direction } from '@API/REST.enum';
import awsIcon from '@assets/aws.svg';
import ibmIcon from '@assets/ibm.svg';
import kubernetesIcon from '@assets/kubernetes.svg';
import podmanIcon from '@assets/podman.svg';
import { UPDATE_INTERVAL } from '@config/config';
import { calculateStep } from '@config/prometheus';
import { getTestsIds } from '@config/testIds';
import SkChartArea from '@core/components/SkChartArea';
import SkChartBar from '@core/components/SkChartBar';
import SkTable from '@core/components/SkTable';
import { formatByteRate } from '@core/utils/formatBytes';
import { formatLatency } from '@core/utils/formatLatency';
import { formatToDecimalPlacesIfCents } from '@core/utils/formatToDecimalPlacesIfCents';
import MainContainer from '@layout/MainContainer';
import { CustomProcessPairCells } from '@pages/Processes/Processes.constants';
import { ProcessesLabels, ProcessesRoutesPaths, QueriesProcesses } from '@pages/Processes/Processes.enum';
import { ComponentLabels, ComponentRoutesPaths, QueriesComponent } from '@pages/ProcessGroups/ProcessGroups.enum';
import { QueriesServices, ServicesLabels, ServicesRoutesPaths } from '@pages/Services/Services.enum';
import { QueriesSites, SiteLabels, SitesRoutesPaths } from '@pages/Sites/Sites.enum';
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
    { data: totalAvgLatency },
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
        queryKey: ['QueriesServices.fetchTotalAvgLatency'],
        queryFn: () =>
          PrometheusApi.fetchTotalAvgLatency({
            start,
            end,
            step: calculateStep(end - start),
            direction: Direction.Incoming
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
        acc[link.destinationSiteId] = (acc[link.destinationSiteId] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

  const exposedProcesses = processes.results.filter((process) => process.processBinding === Binding.Exposed);

  const clientErrorCountData = getTimeSeriesFromPrometheusData(clientErrorCount);
  const serverErrorCountData = getTimeSeriesFromPrometheusData(serverErrorCount);

  const siteDataOut = getTimeSeriesFromPrometheusData(siteTrafficOut);
  const siteDataIn = getTimeSeriesFromPrometheusData(siteTrafficIn);

  const txLabels = siteDataOut?.labels.map((label) => decomposePrometheusSiteLabel(label) || '');
  const rxLabels = siteDataIn?.labels.map((label) => decomposePrometheusSiteLabel(label) || '');

  const avgLatency = totalAvgLatency.map(({ value }, index) => [
    {
      x: txLabels?.[index],
      y: Number(value[1])
    }
  ]);

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
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3">Inventory</Title>
            <Grid hasGutter className="pf-v5-u-text-align-center">
              <GridItem span={3}>
                <Card>
                  <CardTitle>
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      <Link to={SitesRoutesPaths.Sites}>{sites.length}</Link>
                    </Title>
                  </CardTitle>
                  <CardBody>{SiteLabels.Section}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={3}>
                <Card>
                  <CardTitle>
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      <Link to={ServicesRoutesPaths.Services}>{services.results.length}</Link>
                    </Title>
                  </CardTitle>
                  <CardBody>{ServicesLabels.Section}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={3}>
                <Card>
                  <CardTitle>
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      <Link to={ComponentRoutesPaths.ProcessGroups}>{components.results.length}</Link>
                    </Title>
                  </CardTitle>
                  <CardBody>{ComponentLabels.Section}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={3}>
                <Card>
                  <CardTitle>
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      <Link to={ProcessesRoutesPaths.Processes}>
                        {exposedProcesses.length}/{processes.results.length}
                      </Link>
                    </Title>
                  </CardTitle>
                  <CardBody>{`${ProcessesLabels.Section} exposed`}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={12}>
                <Card>
                  <CardBody>
                    <DescriptionList
                      columnModifier={{
                        lg: '3Col'
                      }}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>Platforms</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <img src={kubernetesIcon} style={{ width: '16px' }} />

                            <FlexItem>Kubernetes</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <img src={podmanIcon} style={{ width: '16px' }} />
                            <FlexItem>Podman</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>

                      <DescriptionListGroup>
                        <DescriptionListTerm>Providers</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <img src={ibmIcon} style={{ width: '20px' }} />
                            <FlexItem>IBM</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <img src={awsIcon} style={{ width: '20px' }} />
                            <FlexItem>AWS</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>

                      <DescriptionListGroup>
                        <DescriptionListTerm>Protocols</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>Http1</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>Http2</FlexItem>
                          </Flex>
                        </DescriptionListDescription>

                        <DescriptionListDescription>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>Tcp</FlexItem>
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem span={12}>
                <SkTable
                  isFullHeight
                  alwaysShowPagination={true}
                  columns={InventoryColumns}
                  rows={currentSiteValues}
                  pagination={true}
                  paginationPageSize={5}
                />
              </GridItem>
            </Grid>
          </StackItem>

          <StackItem>
            <Title headingLevel="h3">Metrics</Title>
            <Grid hasGutter>
              <GridItem span={4}>
                <Card>
                  <CardTitle color="red">
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      {10}
                    </Title>
                  </CardTitle>
                  <CardBody>{'Tcp Open connections'}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={4}>
                <Card>
                  <CardTitle color="red">
                    <Title headingLevel="h1" size={TitleSizes['4xl']}>
                      {clientErrorCountData?.values[0].length || 0}
                    </Title>
                  </CardTitle>
                  <CardBody>{'Http Client errors'}</CardBody>
                </Card>
              </GridItem>

              <GridItem span={4}>
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

              <GridItem md={12}>
                <Card>
                  <CardTitle>
                    <Title headingLevel="h4">{'Top 10 Average latency by site'}</Title>
                  </CardTitle>
                  <CardBody>
                    <SkChartBar
                      formatY={formatLatency}
                      themeColor={ChartThemeColor.multi}
                      legendLabels={txLabels}
                      data={avgLatency}
                      padding={{
                        bottom: 65,
                        left: 80,
                        right: 100,
                        top: 20
                      }}
                    />
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem span={6}>
                <SkTable
                  isFullHeight
                  alwaysShowPagination={false}
                  title={'Top 10 Rx Byterate by Site'}
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
                  title={'Top 10 Tx byterate by Site'}
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
          </StackItem>
        </Stack>
      }
    />
  );
};

export default Dashboard;
