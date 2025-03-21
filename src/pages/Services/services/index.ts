import { DEFAULT_COMPLEX_STRING_SEPARATOR } from '../../../config/app';
import { styles } from '../../../config/styles';
import { DEFAULT_SANKEY_CHART_FLOW_VALUE } from '../../../core/components/SkCharts/SKSanckeyChart/SkSankey.constants';
import { removeDuplicatesFromArrayOfObjects } from '../../../core/utils/removeDuplicatesFromArrayOfObjects';
import { GraphCombo, GraphEdge, GraphElementNames, GraphIconKeys, GraphNode } from '../../../types/Graph.interfaces';
import { ConnectorResponse, ListenerResponse } from '../../../types/REST.interfaces';
import { MetricKeys, SkSankeyChartNode } from '../../../types/SkSankeyChart.interfaces';

export const ServicesController = {
  convertPairsToSankeyChartData: (
    servicePairs: {
      sourceName: string;
      destinationName: string;
      bytes: number;
      byteRate: number;
    }[],
    metricSelected?: MetricKeys | ''
  ) => {
    // Generate nodes and links
    const nodes = generateSankeyNodes(servicePairs);
    const links = generateSankeyLinks(servicePairs, metricSelected);

    return { nodes, links };
  },

  mapListenersToRoutingKey: (listeners: ListenerResponse[]) =>
    listeners.map(({ identity, name, siteId, siteName, routingKey, serviceId }) => ({
      sourceId: identity,
      sourceName: name,
      siteId: `${siteId}-listener`, // Avoids including connectors and processes in the combo
      siteName,
      destinationId: serviceId,
      destinationName: routingKey,
      type: 'SkEmptyNode' as GraphElementNames,
      iconName: 'listener' as GraphIconKeys
    })),

  mapConnectorsToProcesses: (connectors: ConnectorResponse[]) =>
    connectors.map((item) => ({
      sourceId: `${getConnectorBaseName(item.name)}-${item.siteId}-${item.destPort}`,
      sourceName: `${getConnectorBaseName(item.name)}:${item.destPort}`,
      siteId: item.siteId,
      siteName: item.siteName,
      destinationId: item.processId,
      destinationName: `${item.target}`,
      type: 'SkEmptyNode' as GraphElementNames,
      iconName: 'connector' as GraphIconKeys
    })),

  mapRoutingKeyToAggregatedConnectors: (aggregatedConnectors: ConnectorResponse[], id: string, name: string) =>
    aggregatedConnectors.length
      ? aggregatedConnectors.map((item) => ({
          sourceId: item.serviceId,
          sourceName: item.routingKey,
          destinationId: `${item.name}-${item.siteId}-${item.destPort}`,
          destinationName: `${item.name}:${item.destPort}`,
          type: 'SkEmptyNode' as GraphElementNames,
          iconName: 'routingKey' as GraphIconKeys
        }))
      : [
          {
            sourceId: id,
            sourceName: name,
            destinationId: ``,
            destinationName: ``,
            type: 'SkEmptyNode' as GraphElementNames,
            iconName: 'routingKey' as GraphIconKeys
          }
        ],

  convertPairsTopologyData: (
    servicePairs: {
      sourceId: string;
      sourceName: string;
      siteId?: string;
      siteName?: string;
      destinationId: string;
      destinationName: string;
      byteRate?: number;
      color?: string;
      iconName: GraphIconKeys;
      type: GraphElementNames;
    }[]
  ): { nodes: GraphNode[]; edges: GraphEdge[]; combos: GraphCombo[] } => {
    const generateTopologyNodes = (pairs: typeof servicePairs) => {
      const clients = pairs.map(({ type, iconName, sourceId, sourceName, siteId }) => ({
        type,
        id: sourceId,
        name: sourceName,
        label: sourceName,
        iconName,
        combo: siteId
      }));

      const servers = pairs.map(({ destinationId, destinationName, siteId }) => ({
        id: destinationId,
        name: destinationName,
        label: destinationName,
        type: 'SkEmptyNode' as GraphElementNames,
        iconName: 'process' as GraphIconKeys,
        combo: siteId
      }));

      return removeDuplicates([...clients, ...servers], 'id').filter(({ id }) => id);
    };

    const generateTopologyEdges = (pairs: typeof servicePairs) => {
      const links = pairs
        .map(({ sourceId, sourceName, destinationId, destinationName }) => ({
          type: 'SkListenerConnectorEdge' as GraphElementNames,
          id: `${sourceId}-${destinationId}`,
          source: sourceId,
          sourceName,
          target: destinationId,
          targetName: destinationName
        }))
        .filter(({ source, target }) => source && target);

      return removeDuplicates(links, 'id');
    };

    const generateTopologyCombos = (pairs: typeof servicePairs) => {
      const combos = pairs
        .map(({ siteId, siteName }) => ({
          type: 'SkCombo' as GraphElementNames,
          id: siteId || '',
          label: siteName || ''
        }))
        .filter(({ id }) => id);

      return removeDuplicates(combos, 'id');
    };

    // Generate nodes and edges
    const nodes = generateTopologyNodes(servicePairs);
    const edges = generateTopologyEdges(servicePairs);
    const combos = generateTopologyCombos(servicePairs);

    return { nodes, edges, combos };
  }
};

/**
 * Removes duplicate objects from an array based on a given key.
 */
const removeDuplicates = <T>(items: T[], key: keyof T): T[] =>
  items.filter((item, index, array) => array.findIndex((v) => v[key] === item[key]) === index);

/**
 * Generates Sankey nodes based on source and destination data.
 */
const generateSankeyNodes = (
  servicePairs: {
    sourceName: string;
    sourceSiteName?: string;
    destinationName: string;
    destinationSiteName?: string;
    color?: string;
  }[]
): SkSankeyChartNode[] => {
  const clients = servicePairs.map(({ sourceName, sourceSiteName, color = styles.default.infoColor }) => ({
    id: `${sourceName}.`,
    nodeColor: sourceSiteName ? styles.default.darkBackgroundColor : color
  }));

  const servers = servicePairs.map(({ destinationName, destinationSiteName, color = styles.default.infoColor }) => ({
    id: destinationName,
    nodeColor: destinationSiteName ? styles.default.darkBackgroundColor : color
  }));

  return removeDuplicates([...clients, ...servers], 'id');
};

/**
 * Generates Sankey links based on service pairs.
 */
const generateSankeyLinks = (
  servicePairs: {
    sourceName: string;
    destinationName: string;
    bytes: number;
    byteRate: number;
  }[],
  metricSelected?: MetricKeys | ''
) =>
  removeDuplicatesFromArrayOfObjects(
    servicePairs
      .map(({ sourceName, destinationName, ...rest }) => ({
        source: `${sourceName}.`,
        target: destinationName,
        value:
          metricSelected && rest[metricSelected] ? (rest[metricSelected] as number) : DEFAULT_SANKEY_CHART_FLOW_VALUE
      }))
      .filter(({ source, target }) => source && target)
  );

export function getConnectorBaseName(name: string): string {
  // the name of a connector as this format name@IP
  const partialName = name.split(DEFAULT_COMPLEX_STRING_SEPARATOR);

  if (partialName.length) {
    return partialName[0];
  }

  return name;
}

// Utility function for aggregating connector responses
export function aggregateConnectorResponses(connectors: ConnectorResponse[]) {
  const aggregatedResults: Record<string, ConnectorResponse> = {};

  connectors.forEach((connector) => {
    const baseName = getConnectorBaseName(connector.name);
    const key = `${connector.routerId}-${baseName}`;

    if (!aggregatedResults[key]) {
      aggregatedResults[key] = { ...connector, name: baseName, count: 1, processes: [connector] };
    } else {
      aggregatedResults[key].count!++;
      aggregatedResults[key].processes!.push(connector);
    }
  });

  return Object.values(aggregatedResults);
}
