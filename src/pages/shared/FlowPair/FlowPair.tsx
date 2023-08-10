import { FC } from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Icon,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { LaptopIcon, LongArrowAltDownIcon, LongArrowAltUpIcon, ServerIcon } from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { RESTApi } from '@API/REST.api';
import { AvailableProtocols } from '@API/REST.enum';
import { ConnectionTCP, RequestHTTP } from '@API/REST.interfaces';
import { UPDATE_INTERVAL } from '@config/config';
import { getTestsIds } from '@config/testIds.config';
import ResourceIcon from '@core/components/ResourceIcon';
import { formatBytes } from '@core/utils/formatBytes';
import { formatLatency } from '@core/utils/formatLatency';
import { formatTimeInterval } from '@core/utils/formatTimeInterval';
import { formatTraceBySites } from '@core/utils/formatTrace';
import { QueriesServices } from '@pages/Addresses/services/services.enum';
import { ProcessesRoutesPaths } from '@pages/Processes/Processes.enum';

import { FlowLabels } from './FlowPair.enum';
import LoadingPage from '../Loading';

const FlowPair: FC<{ flowPairId: string }> = function ({ flowPairId }) {
  const { data: flowPair } = useQuery(
    [QueriesServices.GetFlowPair, flowPairId],
    () => RESTApi.fetchFlowPair(flowPairId),
    {
      suspense: false,
      refetchInterval: UPDATE_INTERVAL
    }
  );

  if (!flowPair) {
    return <LoadingPage />;
  }

  const { forwardFlow, counterFlow, protocol, endTime, startTime, identity, flowTrace } = flowPair;

  /**
   *  endTime and startTime are microseconds (because the Apis give us microseconds)
   */
  const duration = formatTimeInterval(endTime || Date.now() * 1000, startTime);

  return (
    <Grid hasGutter data-testid={getTestsIds.flowPairsView(identity)}>
      <GridItem span={12}>
        {protocol === AvailableProtocols.Tcp && (
          <>
            <TextContent>
              <Text component={TextVariants.h2}>Connection {endTime ? 'closed' : 'open'}</Text>
            </TextContent>

            <Card isPlain>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{FlowLabels.Trace}</DescriptionListTerm>
                    <DescriptionListDescription>{formatTraceBySites(flowTrace)}</DescriptionListDescription>
                    {duration && (
                      <>
                        <DescriptionListTerm>{FlowLabels.Duration}</DescriptionListTerm>
                        <DescriptionListDescription>{duration}</DescriptionListDescription>
                      </>
                    )}
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </>
        )}
        {protocol !== AvailableProtocols.Tcp && (
          <>
            <TextContent>
              <Text component={TextVariants.h2}>Request {endTime ? 'terminated' : 'open'}</Text>
            </TextContent>
            <Card isPlain>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{FlowLabels.Protocol}</DescriptionListTerm>
                    <DescriptionListDescription>{protocol}</DescriptionListDescription>
                    <DescriptionListTerm>{FlowLabels.Method}</DescriptionListTerm>
                    <DescriptionListDescription>{forwardFlow.method}</DescriptionListDescription>
                    <DescriptionListTerm>{FlowLabels.Trace}</DescriptionListTerm>
                    <DescriptionListDescription>{formatTraceBySites(flowTrace)}</DescriptionListDescription>
                    {duration && (
                      <>
                        <DescriptionListTerm>{FlowLabels.Duration}</DescriptionListTerm>
                        <DescriptionListDescription>{duration}</DescriptionListDescription>
                      </>
                    )}
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </>
        )}
      </GridItem>

      <GridItem span={6}>
        {flowPair.protocol === AvailableProtocols.Tcp ? (
          <ConnectionDetail title={FlowLabels.Flow} flow={forwardFlow} />
        ) : (
          <RequestDetail title={FlowLabels.Flow} flow={forwardFlow} />
        )}
      </GridItem>
      <GridItem span={6}>
        {flowPair.protocol === AvailableProtocols.Tcp ? (
          <ConnectionDetail title={FlowLabels.CounterFlow} flow={counterFlow} isCounterflow={true} />
        ) : (
          <RequestDetail title={FlowLabels.CounterFlow} flow={counterFlow} isCounterflow={true} />
        )}
      </GridItem>
    </Grid>
  );
};

export default FlowPair;

interface DescriptionProps {
  title: string;
  flow: ConnectionTCP & RequestHTTP;
  isCounterflow?: boolean;
}

const ConnectionDetail: FC<DescriptionProps> = function ({ title, flow, isCounterflow = false }) {
  return (
    <Card isFullHeight isPlain>
      <CardTitle>
        <Title headingLevel="h2">
          {' '}
          <Icon isInline size="md">
            {isCounterflow ? <ServerIcon /> : <LaptopIcon />}
          </Icon>
          {'  '}
          {title}
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{FlowLabels.Process}</DescriptionListTerm>
            <DescriptionListDescription>
              <>
                {<ResourceIcon type="process" />}
                <Link to={`${ProcessesRoutesPaths.Processes}/${flow.processName}@${flow.process}`}>
                  {flow.processName}
                </Link>
              </>
            </DescriptionListDescription>
            <DescriptionListTerm>{isCounterflow ? FlowLabels.DestHost : FlowLabels.Host}</DescriptionListTerm>
            <DescriptionListDescription>{flow.sourceHost}</DescriptionListDescription>
            <DescriptionListTerm>{isCounterflow ? FlowLabels.DestPort : FlowLabels.Port}</DescriptionListTerm>
            <DescriptionListDescription>{flow.sourcePort}</DescriptionListDescription>
            <DescriptionListTerm>{FlowLabels.BytesTransferred}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatBytes(flow.octets)}{' '}
              <Icon>
                {' '}
                {isCounterflow ? (
                  <LongArrowAltDownIcon color="var(--pf-v5-global--palette--blue-300)" />
                ) : (
                  <LongArrowAltUpIcon color="var(--pf-v5-global--palette--green-400)" />
                )}
              </Icon>
            </DescriptionListDescription>
            <DescriptionListTerm>{FlowLabels.ByteUnacked}</DescriptionListTerm>
            <DescriptionListDescription>{formatBytes(flow.octetsUnacked)}</DescriptionListDescription>
            <DescriptionListTerm>{FlowLabels.WindowSize}</DescriptionListTerm>
            <DescriptionListDescription>{formatBytes(flow.windowSize)}</DescriptionListDescription>
            <DescriptionListTerm>{FlowLabels.Latency}</DescriptionListTerm>
            <DescriptionListDescription>{formatLatency(flow.latency)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

const RequestDetail: FC<DescriptionProps> = function ({ title, flow, isCounterflow }) {
  return (
    <Card isFullHeight isPlain>
      <CardTitle>
        <Title headingLevel="h2">
          {' '}
          <Icon isInline size="md">
            {isCounterflow ? <ServerIcon /> : <LaptopIcon />}
          </Icon>
          {'  '}
          {title}
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList isAutoFit>
          <DescriptionListGroup>
            <DescriptionListTerm>{FlowLabels.Process}</DescriptionListTerm>
            <DescriptionListDescription>
              <>
                {<ResourceIcon type="process" />}
                <Link to={`${ProcessesRoutesPaths.Processes}/${flow.processName}@${flow.process}`}>
                  {flow.processName}
                </Link>
              </>
            </DescriptionListDescription>
            <DescriptionListTerm>{FlowLabels.BytesTransferred}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatBytes(flow.octets)}
              <Icon>
                {' '}
                {isCounterflow ? (
                  <LongArrowAltDownIcon color="var(--pf-v5-global--palette--blue-300)" />
                ) : (
                  <LongArrowAltUpIcon color="var(-v5-global--palette--green-400)" />
                )}
              </Icon>
            </DescriptionListDescription>{' '}
            <DescriptionListTerm>{FlowLabels.Latency}</DescriptionListTerm>
            <DescriptionListDescription>{formatLatency(flow.latency)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};