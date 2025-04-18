import { GraphEdge, GraphNode } from 'types/Graph.interfaces';

import { Role } from '../../../API/REST.enum';
import { DEFAULT_COMPLEX_STRING_SEPARATOR } from '../../../config/app';
import { PrometheusLabelsV2 } from '../../../config/prometheus';
import { ProcessPairsResponse, ProcessResponse } from '../../../types/REST.interfaces';
import { TopologyMetrics } from '../../../types/Topology.interfaces';
import { shape } from '../Topology.constants';

import { TopologyController, groupEdges, groupNodes } from '.';

interface TopologyProcessControllerProps {
  idsSelected: string[] | undefined;
  searchText: string;
  processes: ProcessResponse[];
  processesPairs: ProcessPairsResponse[];
  metrics: TopologyMetrics | null;
  serviceIdsSelected?: string[];
  options: {
    showLinkBytes: boolean;
    showLinkByteRate: boolean;
    showDeployments: boolean;
    showMetricDistribution: boolean;
    showMetricValue: boolean;
  };
}

export const convertProcessToNode = ({
  identity,
  name,
  siteId: combo,
  siteName: comboName,
  componentId,
  componentName,
  role,
  binding
}: ProcessResponse): GraphNode => ({
  type: shape[role === Role.Remote ? role : binding],
  id: identity,
  name,
  label: name,
  iconName: role === Role.Internal ? 'skupper' : 'process',
  combo,
  comboName,
  groupId: componentId,
  groupName: componentName
});

const convertProcessesToNodes = (processes: ProcessResponse[]): GraphNode[] => processes?.map(convertProcessToNode);

export const TopologyProcessController = {
  dataTransformer: ({
    idsSelected,
    searchText,
    processes,
    processesPairs,
    metrics,
    serviceIdsSelected,
    options
  }: TopologyProcessControllerProps) => {
    let pairsSelectedByService = processesPairs;
    let processesSelected = processes;

    // a process can be filered by services
    if (serviceIdsSelected) {
      const serverIds = processesSelected
        .filter(({ services: services }) =>
          services
            ?.map((service) => parseService(service).serviceId)
            .some((service) => serviceIdsSelected.includes(service))
        )
        .map(({ identity }) => identity);

      pairsSelectedByService = pairsSelectedByService.filter((pair) => serverIds.includes(pair.destinationId));
      const processIdsFromProcessPairsByService = pairsSelectedByService?.flatMap(({ sourceId, destinationId }) => [
        sourceId,
        destinationId
      ]);

      processesSelected = [
        ...filterProcessesBySelectedServices(processes, [...serviceIdsSelected, ...processIdsFromProcessPairsByService])
      ];
    }

    let processNodes = convertProcessesToNodes(processesSelected);
    let processPairEdges = TopologyController.addMetricsToEdges(
      TopologyController.convertPairsToEdges(pairsSelectedByService, 'SkDataEdge'),
      PrometheusLabelsV2.SourceProcessName,
      PrometheusLabelsV2.DestProcessName,
      metrics
    );

    if (options.showDeployments) {
      processNodes = groupNodes(processNodes);
      processPairEdges = groupEdges(processNodes, processPairEdges);
    }

    return {
      // when the id selected comes from an other view the id is a single node/edge but if the topology has the option showDeployments == true, this id can be part of grouped edge/node.
      // In that case, we need to find the node/edge group where the single node is contained
      nodeIdSelected: findMatched(processNodes, idsSelected) || findMatched(processPairEdges, idsSelected),
      nodeIdsToHighLight: TopologyController.nodesToHighlight(processNodes, searchText),
      nodes: processNodes.map((node) => ({
        ...node,
        persistPositionKey: serviceIdsSelected?.length ? `${node.id}-${serviceIdsSelected}` : node.id
      })),
      edges: TopologyController.addLabelToEdges(processPairEdges, options),
      combos: TopologyController.getCombosFromNodes(processNodes)
    };
  }
};

// Function to find the matched node/edge based on the first node in idsSelected
function findMatched(processNodes: GraphNode[] | GraphEdge[], idsSelected?: string[]) {
  if (!idsSelected?.length) {
    return undefined;
  }

  const nodeIdSelectedArray = idsSelected[0].split('~');

  const processNode = processNodes.find(({ id }) => {
    const nodeIds = id.split('~');
    const nodeIdSet = new Set(nodeIds);

    return nodeIdSelectedArray.every((nodeId) => nodeIdSet.has(nodeId));
  });

  return processNode?.id;
}

function filterProcessesBySelectedServices(processes: ProcessResponse[], serviceIdSelected: string[]) {
  return processes.filter(
    (process) =>
      process.services?.some((service) => serviceIdSelected.some((serviceId) => service.includes(`@${serviceId}`))) ||
      serviceIdSelected.includes(process.identity)
  );
}

// the format of one servce is  serviceName@seviceId@protocol
function parseService(serviceString: string) {
  const [serviceName, serviceId, protocol] = serviceString.split(DEFAULT_COMPLEX_STRING_SEPARATOR);

  return {
    serviceName,
    serviceId,
    protocol
  };
}
