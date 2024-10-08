import { PrometheusApi } from '@API/Prometheus.api';
import { Direction } from '@API/REST.enum';
import { IDS_GROUP_SEPARATOR, IDS_MULTIPLE_SELECTION_SEPARATOR, PAIR_SEPARATOR } from '@config/config';
import { formatByteRate, formatBytes } from '@core/utils/formatBytes';
import { formatLatency } from '@core/utils/formatLatency';
import { removeDuplicatesFromArrayOfObjects } from '@core/utils/removeDuplicatesFromArrayOfObjects';
import { PrometheusMetric } from '@sk-types/Prometheus.interfaces';
import { ProcessPairsResponse, SitePairsResponse, ComponentPairsResponse } from '@sk-types/REST.interfaces';
import {
  TopologyMetrics,
  TopologyConfigMetrics,
  TopologyShowOptionsSelected,
  ProcessPairsWithMetrics
} from '@sk-types/Topology.interfaces';
import { GraphEdge, GraphCombo, GraphNode, GraphElementNames } from 'types/Graph.interfaces';

import { shape } from '../Topology.constants';

export const TopologyController = {
  getTopologyMetrics: async ({
    showBytes = false,
    showByteRate = false,
    showLatency = false,
    params
  }: TopologyConfigMetrics): Promise<TopologyMetrics> => {
    try {
      const [bytesByProcessPairs, byteRateByProcessPairs, latencyByProcessPairs] = await Promise.all([
        showBytes ? PrometheusApi.fetchAllProcessPairsBytes(params.fetchBytes.groupBy, params.filterBy) : [],
        showByteRate ? PrometheusApi.fetchAllProcessPairsByteRates(params.fetchByteRate.groupBy, params.filterBy) : [],
        showLatency
          ? PrometheusApi.fetchAllProcessPairsLatencies(params.fetchLatency.groupBy, { ...params.filterBy })
          : []
      ]);

      return { bytesByProcessPairs, byteRateByProcessPairs, latencyByProcessPairs };
    } catch (e: unknown) {
      return Promise.reject(e);
    }
  },

  getCombosFromNodes: (nodes: GraphNode[]): GraphCombo[] => {
    const idLabelPairs = nodes
      .map(({ combo, comboName }) => ({
        type: 'SkCombo' as GraphElementNames,
        id: combo || '',
        label: comboName || ''
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // TODO: BE-bug: The API occasionally returns processes without a siteName for a site.
    // While in some cases, using the hostname as a substitute is acceptable, it can lead to conflicts.
    // This inconsistency results in situations where the hostname and siteName differ but share the same ID.
    const uniqueNodes: GraphCombo[] = [...new Map(idLabelPairs.map((item) => [item.id, item])).values()];

    return removeDuplicatesFromArrayOfObjects(uniqueNodes);
  },

  convertPairsToEdges: (
    processesPairs: ProcessPairsResponse[] | ComponentPairsResponse[] | SitePairsResponse[],
    type: GraphElementNames
  ): GraphEdge[] =>
    processesPairs.map(({ identity, sourceId, destinationId, sourceName, destinationName }) => ({
      type: sourceId === destinationId ? 'SkLoopEdge' : type,
      id: identity,
      source: sourceId,
      target: destinationId,
      sourceName,
      targetName: destinationName
    })),

  addMetricsToProcessPairs: ({ processesPairs, metrics, prometheusKey, processPairsKey }: ProcessPairsWithMetrics) => {
    const getPairsMap = (metricPairs: PrometheusMetric<'vector'>[] | undefined, key: string) =>
      (metricPairs || []).reduce(
        (acc, { metric, value }) => {
          {
            if (metric.sourceProcess === metric.destProcess) {
              // When the source and destination are identical, we should avoid displaying the reverse metric. Instead, we should present the cumulative sum of all directions as a single value.
              acc[`${metric[key]}`] = (Number(acc[`${metric[key]}`]) || 0) + Number(value[1]);
            } else {
              acc[`${metric[key]}`] = Number(value[1]);
            }
          }

          return acc;
        },
        {} as Record<string, number>
      );

    const txBytesByPairsMap = getPairsMap(metrics?.bytesByProcessPairs, prometheusKey);
    const txByteRateByPairsMap = getPairsMap(metrics?.byteRateByProcessPairs, prometheusKey);
    const txLatencyByPairsMap = getPairsMap(metrics?.latencyByProcessPairs, prometheusKey);

    return processesPairs?.map((processPairsData) => ({
      ...processPairsData,
      bytes: txBytesByPairsMap[processPairsData[processPairsKey]] || 0,
      byteRate: txByteRateByPairsMap[processPairsData[processPairsKey]] || 0,
      latency: txLatencyByPairsMap[processPairsData[processPairsKey]] || 0
    }));
  },

  addMetricsToEdges: (
    edges: GraphEdge[],
    metricSourceLabel: 'sourceProcess' | 'sourceSite', // Prometheus metric label to compare with the metricDestLabel
    metricDestLabel: 'destProcess' | 'destSite',
    protocolPairsMap: Record<string, string> | undefined, //
    bytesByPairs?: PrometheusMetric<'vector'>[],
    byteRateByPairs?: PrometheusMetric<'vector'>[],
    latencyByPairs?: PrometheusMetric<'vector'>[]
  ): GraphEdge[] => {
    const getPairsMap = (metricPairs: PrometheusMetric<'vector'>[] | undefined) =>
      (metricPairs || []).reduce(
        (acc, { metric, value }) => {
          {
            if (metric[metricSourceLabel] === metric[metricDestLabel]) {
              // When the source and destination are identical, we should avoid displaying the reverse metric. Instead, we should present the cumulative sum of all directions as a single value.
              acc[`${metric[metricSourceLabel]}${metric[metricDestLabel]}`] =
                (Number(acc[`${metric[metricSourceLabel]}${metric[metricDestLabel]}`]) || 0) + Number(value[1]);
            } else {
              acc[`${metric[metricSourceLabel]}${metric[metricDestLabel]}`] = Number(value[1]);
            }
          }

          return acc;
        },
        {} as Record<string, number>
      );

    const bytesByPairsMap = getPairsMap(bytesByPairs);
    const byteRateByPairsMap = getPairsMap(byteRateByPairs);
    // Incoming metrics indicate that the source is the client and the destination is the server. In our case, the edges have a direction from client to server
    const latencyByPairsMapIn = getPairsMap(
      latencyByPairs?.filter((pair) => pair.metric.direction === Direction.Incoming)
    );

    // Outgoing metrics indicate that the source is the server and the destination is the client. It is used to determine the reverse metric
    const latencyByPairsMapOut = getPairsMap(
      latencyByPairs?.filter((pair) => pair.metric.direction === Direction.Outgoing)
    );

    return edges.map((edge) => {
      const pairKey = `${edge.sourceName}${edge.targetName}`;
      const reversePairKey = `${edge.targetName}${edge.sourceName}`;

      return {
        ...edge,
        metrics: {
          protocol: protocolPairsMap ? protocolPairsMap[`${edge.source}${edge.target}`] : '',
          bytes: bytesByPairsMap[pairKey],
          byteRate: byteRateByPairsMap[pairKey],
          latency: latencyByPairsMapIn[pairKey],
          bytesReverse: bytesByPairsMap[reversePairKey],
          byteRateReverse: byteRateByPairsMap[reversePairKey],
          latencyReverse: latencyByPairsMapOut[reversePairKey]
        }
      };
    });
  },

  configureEdges: (edges: GraphEdge[], options?: TopologyShowOptionsSelected): GraphEdge[] =>
    edges.map((edge) => {
      const byteRate = options?.showLinkByteRate ? edge?.metrics?.byteRate || 0 : undefined;
      const bytes = options?.showLinkBytes ? edge?.metrics?.bytes || 0 : undefined;
      const latency = options?.showLinkLatency ? edge?.metrics?.latency || 0 : undefined;

      // The same edge has RX === Tx
      const showRxMetric = !!options?.showInboundMetrics && !(edge.source === edge.target);

      const byteRateRx = showRxMetric && byteRate !== undefined ? edge?.metrics?.byteRateReverse || 0 : undefined;
      const bytesRx = showRxMetric && bytes !== undefined ? edge?.metrics?.bytesReverse || 0 : undefined;
      const latencyRx = showRxMetric && latency !== undefined ? edge?.metrics?.latencyReverse || 0 : undefined;

      const metricsString = [
        bytes !== undefined && `${formatBytes(bytes)}`,
        byteRate !== undefined && `${formatByteRate(byteRate)}`,
        latency !== undefined && `${formatLatency(latency)}`
      ]
        .filter(Boolean)
        .join(', ');

      const metricsRxString = [
        bytesRx !== undefined && `(${formatBytes(bytesRx)})`,
        byteRateRx !== undefined && `(${formatByteRate(byteRateRx)})`,
        latencyRx !== undefined && `(${formatLatency(latencyRx)})`
      ]
        .filter(Boolean)
        .join(', ');

      const label = options?.showMetricValue ? [metricsString, metricsRxString].filter(Boolean).join('   ') : undefined;

      return {
        ...edge,
        label,
        protocolLabel: options?.showLinkProtocol ? edge?.metrics?.protocol : undefined,
        metricValue: options?.showMetricDistribution ? bytes || byteRate || latency || 0 : undefined
      };
    }),

  loadDisplayOptionsFromLocalStorage(key: string) {
    const displayOptions = localStorage.getItem(key);
    if (displayOptions) {
      return JSON.parse(displayOptions);
    }

    return null;
  },
  transformIdsToStringIds(ids?: string[]) {
    return ids?.join(IDS_MULTIPLE_SELECTION_SEPARATOR);
  },
  transformStringIdsToIds(ids?: string) {
    return ids?.split(IDS_MULTIPLE_SELECTION_SEPARATOR);
  },
  arePairIds(ids?: string) {
    return !!ids?.includes(PAIR_SEPARATOR);
  },
  transformStringGroupIdsToGroupIds(ids?: string) {
    return ids?.split(IDS_GROUP_SEPARATOR);
  },
  areGroupOfIds(ids?: string) {
    return !!ids?.includes(IDS_GROUP_SEPARATOR);
  },
  nodesToHighlight(nodes: GraphNode[], text: string) {
    return nodes.filter((node) => text && node.label.includes(text)).map((node) => node.id);
  }
};

/**
 * Groups an array of GraphNode objects based on their combo and groupId properties.
 */
export function groupNodes(nodes: GraphNode[]): GraphNode[] {
  const groupedNodes: Record<string, GraphNode> = {};

  nodes.forEach((item) => {
    const group = `${item.combo}-${item.groupId}`;

    if (!groupedNodes[group]) {
      groupedNodes[group] = {
        ...item,
        id: '',
        combo: item.combo,
        groupCount: 0,
        type: item.type
      };
    }

    // Collect ids into an array
    const ids = [groupedNodes[group].id, item.id];
    const type = groupedNodes[group].type === shape.bound ? shape.bound : item.type;
    // Use join to concatenate ids with the GROUP_SEPARATOR
    groupedNodes[group].id = ids.filter(Boolean).join(IDS_GROUP_SEPARATOR);
    groupedNodes[group].groupCount! += 1;

    if (groupedNodes[group].groupCount! > 1) {
      groupedNodes[group].label = `${item.groupName}-${item.comboName}` || '';
      groupedNodes[group].type = type;
      groupedNodes[group].groupedNodeCount = groupedNodes[group].groupCount;
    }
  });

  // Convert groupedNodes object to an array
  return Object.values(groupedNodes);
}

/**
 * Combines the edges of a graph with the corresponding nodes or grouped nodes.
 */
export function groupEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  // Reduce the array of edges to a mapping of combined edges
  const edgeMap: { [key: string]: GraphEdge } = edges.reduce(
    (acc, edge) => {
      // Find matching nodes for source and target in the nodes array
      const sourceMatch = nodes.find(({ id }) => id.includes(edge.source));
      const targetMatch = nodes.find(({ id }) => id.includes(edge.target));

      // Update source and target with matched node IDs, if found
      const newSource = sourceMatch ? sourceMatch.id : edge.source;
      const newTarget = targetMatch ? targetMatch.id : edge.target;

      // Create a unique key based on the combination of newSource and newTarget
      const group = `${newSource}-${newTarget}`;

      // If the key already exists, add the metrics, otherwise, add the new edge
      acc[group] = acc[group] || {
        ...edge,
        id: '', // The 'id' string will be concatenated with the process ID
        metrics: {
          protocol: '',
          bytes: 0,
          byteRate: 0,
          latency: 0,
          bytesReverse: 0,
          byteRateReverse: 0,
          latencyReverse: 0
        },
        source: newSource,
        target: newTarget
      };

      if (acc[group].id !== '') {
        acc[group].id += IDS_GROUP_SEPARATOR;
      }

      acc[group].id += edge.id;

      if (edge.metrics) {
        acc[group].metrics = {
          protocol:
            edge.metrics.protocol && acc[group]?.metrics?.protocol?.includes(edge.metrics.protocol)
              ? acc[group]?.metrics?.protocol || ''
              : [acc[group]?.metrics?.protocol, edge.metrics.protocol].filter(Boolean).join(','),
          bytes: (acc[group]?.metrics?.bytes || 0) + (edge.metrics.bytes || 0),
          byteRate: (acc[group]?.metrics?.byteRate || 0) + (edge.metrics.byteRate || 0),
          latency: (acc[group]?.metrics?.latency || 0) + (edge.metrics.latency || 0),
          bytesReverse: (acc[group]?.metrics?.bytesReverse || 0) + (edge.metrics.bytesReverse || 0),
          byteRateReverse: (acc[group]?.metrics?.byteRateReverse || 0) + (edge.metrics.byteRateReverse || 0),
          latencyReverse: (acc[group]?.metrics?.latencyReverse || 0) + (edge.metrics.latencyReverse || 0)
        };
      }

      return acc;
    },
    {} as { [key: string]: GraphEdge }
  );

  // Convert the mapping to an array of edges
  return Object.values(edgeMap);
}
