import { ModelStyle } from '@antv/g6';

import { PrometheusMetric, PrometheusLabels } from '@API/Prometheus.interfaces';
import { ProcessPairsResponse, ProcessResponse } from '@API/REST.interfaces';

export interface Entity {
  id: string;
  comboId?: string;
  comboName?: string;
  groupId?: string;
  groupName?: string;
  label: string;
  iconFileName: string;
  iconProps?: { show: boolean; width: number; height: number };
  nodeConfig?: ModelStyle;
  enableBadge1: boolean;
}

export interface TopologyMetrics {
  bytesByProcessPairs: PrometheusMetric<'vector'>[];
  byteRateByProcessPairs: PrometheusMetric<'vector'>[];
  latencyByProcessPairs: PrometheusMetric<'vector'>[];
}

export interface TopologyConfigMetrics {
  showBytes?: boolean;
  showByteRate?: boolean;
  showLatency?: boolean;
  params: {
    fetchBytes: { groupBy: string };
    fetchByteRate: { groupBy: string };
    fetchLatency: { groupBy: string };
    filterBy?: PrometheusLabels;
  };
}

export interface DisplaySelectProps {
  key: string;
  value: string;
  label: string;
  isDisabled?: Function;
}

export interface DisplayOptions {
  showLinkProtocol?: boolean;
  showLinkBytes?: boolean;
  showLinkByteRate?: boolean;
  showLinkLatency?: boolean;
  showLinkLabelReverse?: boolean;
  rotateLabel?: boolean;
}

export interface NodeOrEdgeListProps {
  ids?: string[];
  items: ProcessResponse[] | ProcessPairsResponse[];
  modalType: 'process' | 'processPair';
}

export interface ProcessPairsWithMetrics {
  processesPairs?: ProcessPairsResponse[];
  metrics?: TopologyMetrics;
  prometheusKey: 'sourceProcess' | 'destProcess';
  processPairsKey: 'sourceName' | 'destinationName';
}
