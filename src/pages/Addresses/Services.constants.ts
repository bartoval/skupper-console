import { SortDirection, TcpStatus } from '@API/REST.enum';
import { BIG_PAGINATION_SIZE } from '@config/config';
import LinkCell from '@core/components/LinkCell';
import { LinkCellProps } from '@core/components/LinkCell/LinkCell.interfaces';
import { sankeyMetricOptions } from '@core/components/SKSanckeyChart/SankeyFilter';
import { SKColumn } from '@core/components/SkTable/SkTable.interfaces';
import { formatByteRate } from '@core/utils/formatBytes';
import { timeAgo } from '@core/utils/timeAgo';
import { ProcessesTableColumns } from '@pages/Processes/Processes.enum';
import { httpFlowPairsColumns, tcpFlowPairsColumns } from '@pages/shared/FlowPair/FlowPair.constants';
import { FlowPairsColumnsNames } from '@pages/shared/FlowPair/FlowPair.enum';
import { AddressResponse, ProcessResponse, RequestOptions } from 'API/REST.interfaces';

import { AddressesRoutesPaths, AddressesLabels, AddressesColumnsNames } from './Services.enum';

export const ServicesPaths = {
  path: AddressesRoutesPaths.Services,
  name: AddressesLabels.Section
};

export const customServiceCells = {
  AddressNameLinkCell: (props: LinkCellProps<AddressResponse>) =>
    LinkCell({
      ...props,
      type: 'service',
      link: `${AddressesRoutesPaths.Services}/${props.data.name}@${props.data.identity}@${props.data.protocol}`
    })
};

// Services Table
export const ServiceColumns: SKColumn<AddressResponse>[] = [
  {
    name: AddressesColumnsNames.Name,
    prop: 'name',
    customCellName: 'AddressNameLinkCell'
  },
  {
    name: AddressesColumnsNames.Protocol,
    prop: 'protocol',
    width: 15
  },
  {
    name: AddressesColumnsNames.Servers,
    prop: 'connectorCount',
    width: 15
  },
  {
    name: AddressesColumnsNames.CurrentFlowPairs,
    columnDescription: 'Live connections or requests',

    prop: 'currentFlows' as keyof AddressResponse,
    width: 15
  },
  {
    name: AddressesColumnsNames.TotalFLowPairs,
    columnDescription: 'Total connections or requests',

    prop: 'totalFlows' as keyof AddressResponse,
    width: 15
  }
];

// Server Table
export const tcpServerColumns = [
  {
    name: ProcessesTableColumns.Name,
    prop: 'name' as keyof ProcessResponse,
    customCellName: 'linkCell'
  },
  {
    name: ProcessesTableColumns.Component,
    prop: 'groupName' as keyof ProcessResponse,
    customCellName: 'linkComponentCell'
  },
  {
    name: ProcessesTableColumns.Site,
    prop: 'parentName' as keyof ProcessResponse,
    customCellName: 'linkCellSite'
  },
  {
    name: ProcessesTableColumns.ByteRateRx,
    prop: 'byteRate' as keyof ProcessResponse,
    format: formatByteRate
  },
  {
    name: ProcessesTableColumns.Created,
    prop: 'startTime' as keyof ProcessResponse,
    format: timeAgo
  }
];

// Http/2 Table
export const httpColumns = httpFlowPairsColumns;

// Tcp Table
const tcpHiddenColumns: Record<string, { show: boolean }> = {
  [FlowPairsColumnsNames.Closed]: {
    show: false
  },
  [FlowPairsColumnsNames.To]: {
    show: false
  }
};

export const tcpColumns = tcpFlowPairsColumns.map((flowPair) => ({
  ...flowPair,
  show: tcpHiddenColumns[flowPair.name]?.show
}));

export const TAB_0_KEY = '0';
export const TAB_1_KEY = '1';
export const TAB_2_KEY = '2';
export const TAB_3_KEY = '3';

export const servicesSelectOptions: { name: string; id: string }[] = [
  {
    name: 'Address',
    id: 'name'
  },
  {
    name: 'Protocol',
    id: 'protocol'
  }
];

// Filters
export const initServersQueryParams = {
  limit: BIG_PAGINATION_SIZE,
  endTime: 0 // active servers
};

export const initActiveConnectionsQueryParams: RequestOptions = {
  state: TcpStatus.Active,
  limit: BIG_PAGINATION_SIZE,
  sortName: 'endTime',
  sortDirection: SortDirection.DESC
};

export const initOldConnectionsQueryParams: RequestOptions = {
  state: TcpStatus.Terminated,
  limit: BIG_PAGINATION_SIZE,
  sortName: 'endTime',
  sortDirection: SortDirection.DESC
};

export const initRequestsQueryParams: RequestOptions = {
  limit: BIG_PAGINATION_SIZE,
  sortName: 'endTime',
  sortDirection: SortDirection.DESC
};

export const defaultMetricOption = sankeyMetricOptions[0].id;

export const PREFIX_DISPLAY_INTERVAL_CACHE_KEY = 'service-display-interval';