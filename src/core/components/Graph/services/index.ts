import { ComboData, EdgeData, Graph, ID, NodeData } from '@antv/g6';

import { GRAPH_CONTAINER_ID } from '../Graph.constants';
import {
  GraphCombo,
  GraphEdge,
  GraphNode,
  LocalStorageData,
  LocalStorageDataSaved,
  LocalStorageDataSavedPayload
} from '../Graph.interfaces';

const prefixLocalStorageItem = 'skupper';

export const GraphController = {
  saveAllNodePositions: (nodes: LocalStorageData[]) => {
    const savedNodePositionsMap = JSON.parse(
      localStorage.getItem(prefixLocalStorageItem) || '{}'
    ) as LocalStorageDataSaved;

    const nodePositionsMap = nodes.reduce((acc, { id, x, y }) => {
      acc[id] = { x, y };

      return acc;
    }, {} as LocalStorageDataSaved);

    const result = { ...savedNodePositionsMap };

    for (const key in nodePositionsMap) {
      if (key in result) {
        delete result[key];
      }
    }

    Promise.resolve(localStorage.setItem(prefixLocalStorageItem, JSON.stringify({ ...result, ...nodePositionsMap })));
  },

  removeAllNodePositionsFromLocalStorage() {
    localStorage.removeItem(prefixLocalStorageItem);
  },

  cleanControlsFromLocalStorage(suffix: string) {
    Object.keys(localStorage)
      .filter((x) => x.endsWith(suffix))
      .forEach((x) => localStorage.removeItem(x));
  },

  fromNodesToLocalStorageData(nodes: NodeData[], setLocalStorageData: Function) {
    return nodes
      .map((node) => {
        const { id } = node;
        const { persistPositionKey } = node.data as Record<string, number>;
        const { x, y } = node.style as Record<string, number>;

        if (id && x !== undefined && y !== undefined) {
          return setLocalStorageData({ id: persistPositionKey || id, x, y });
        }

        return undefined;
      })
      .filter(Boolean) as LocalStorageData[];
  },

  addPositionsToNodes(nodesWithoutPosition: GraphNode[], nodesWithPositions: NodeData[] = []): GraphNode[] {
    const cache = JSON.parse(localStorage.getItem(prefixLocalStorageItem) || '{}');

    const nodesWithCachedPosition = nodesWithoutPosition.map((node) => {
      const positions = cache[node.persistPositionKey || node.id] as LocalStorageDataSavedPayload | undefined;

      const x = positions ? positions.x : undefined;
      const y = positions ? positions.y : undefined;

      return { ...node, x, y };
    });

    //Map of the most updated nodes from the graph
    const positionMap = nodesWithPositions?.reduce(
      (acc, node) => {
        const { x, y } = node.style as Record<string, number>;
        const { persistPositionKey } = node.data as Record<string, number>;

        const id = persistPositionKey || node.id;
        acc[id] = { x, y };

        return acc;
      },
      {} as Record<string, { x?: number; y?: number }>
    );

    // check updated nodes from the graph otherwise rollback to the localstorage position
    const nodes = nodesWithCachedPosition.map((node) => ({
      ...node,
      x: positionMap[node.persistPositionKey || node.id]?.x || node.x,
      y: positionMap[node.persistPositionKey || node.id]?.y || node.y
    }));

    return nodes;
  },

  cleanAllLocalNodePositions(nodes: NodeData[], shouldRemoveFixedPosition: boolean = false) {
    return nodes.forEach((node) => {
      const nodeModel = node.style as NodeData;
      nodeModel.x = undefined;
      nodeModel.y = undefined;

      if (shouldRemoveFixedPosition && nodeModel.data) {
        nodeModel.data.fx = undefined;
        nodeModel.data.fy = undefined;
      }
    });
  },

  transformData: ({
    nodes,
    edges,
    combos
  }: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    combos?: GraphCombo[];
  }): {
    nodes: NodeData[];
    edges: EdgeData[];
    combos?: ComboData[];
  } => {
    const transformedEdges = markPairs(addCountUsageSource(sanitizeEdges(nodes, edges))) as (GraphEdge & {
      usageCount: number;
      hasPair: boolean;
      isSame: boolean;
    })[];
    const comboIds = combos?.map(({ id }) => id);

    return {
      nodes: nodes.map(({ id, combo, label, iconSrc, type = 'SkNode', groupedNodeCount, x, y, ...data }) => ({
        id,
        combo: combo && comboIds?.includes(combo) ? combo : undefined,
        type,
        data: {
          ...data,
          cluster: combo,
          fx: x,
          fy: y
        },
        style: {
          x,
          y,
          labelText: label,
          iconSrc,
          badge: groupedNodeCount !== undefined,
          badges: [
            {
              text: groupedNodeCount ? groupedNodeCount?.toString() : '',
              placement: 'right-top'
            }
          ]
        }
      })),

      edges: transformedEdges.map(
        ({
          id,
          source,
          target,
          label,
          labelRotate,
          isSame,
          hasPair,
          usageCount,
          type = 'SkSiteDataEdge',
          ...data
        }) => ({
          id,
          source,
          target,
          type: isSame ? 'SkLoopEdge' : hasPair && type !== 'SkSiteEdge' ? 'SkSiteDataEdge' : type,
          data,
          style: {
            label: !!label,
            labelText: label,
            labelAutoRotate: labelRotate,
            curveOffset: hasPair ? 30 : (usageCount - 1) * 15
          }
        })
      ),

      combos: combos?.map(({ id, label, type = 'SkCombo' }) => ({
        id,
        type,
        style: {
          labelText: label
        }
      }))
    };
  },

  activateNodeRelations: (graphInstance: Graph, itemId: ID) => {
    const neighbors = graphInstance.getNeighborNodesData(itemId);
    const neighborsIds = neighbors.map(({ id }) => id);

    const allIdsWithEmptyState: Record<string, []> = {};
    const allHiddenIds: Record<string, 'hidden'> = {};

    graphInstance.getNodeData().forEach(({ id }) => {
      allIdsWithEmptyState[id] = [];

      if (itemId !== id && !neighborsIds.includes(id)) {
        allHiddenIds[id] = 'hidden';
      }
    });

    graphInstance.getEdgeData().forEach(({ id, source, target }) => {
      if (id) {
        if (itemId !== source && itemId !== target) {
          allHiddenIds[id] = 'hidden';
        } else {
          allIdsWithEmptyState[id] = [];
        }
      }
    });

    graphInstance.setElementState(allIdsWithEmptyState, false);
    graphInstance.setElementState(allHiddenIds, false);
    graphInstance.setElementState(itemId, 'activeElement', false);
  },

  activateEdgeRelations: (graphInstance: Graph, itemId: ID) => {
    const { target, source } = graphInstance.getEdgeData(itemId);

    const allIdsWithEmptyState: Record<string, []> = {};
    const allHiddenIds: Record<string, 'hidden'> = {};

    graphInstance.getNodeData().forEach(({ id }) => {
      allIdsWithEmptyState[id] = [];

      if (id !== source && id !== target) {
        allHiddenIds[id] = 'hidden';
      }
    });

    graphInstance.getEdgeData().forEach(({ id }) => {
      if (id) {
        if (itemId !== id) {
          allHiddenIds[id] = 'hidden';
        } else {
          allIdsWithEmptyState[id] = [];
        }
      }
    });

    graphInstance.setElementState(allIdsWithEmptyState, false);
    graphInstance.setElementState(allHiddenIds, false);
    graphInstance.setElementState(itemId, 'activeElement', false);
  },

  cleanAllRelations: (graphInstance: Graph) => {
    if (!graphInstance) {
      return;
    }
    const allIdsWithSEmptyState: Record<string, []> = {};

    [...graphInstance.getNodeData(), ...graphInstance.getEdgeData()].forEach(({ id }) => {
      if (id) {
        allIdsWithSEmptyState[id] = [];
      }
    });

    graphInstance.setElementState(allIdsWithSEmptyState, false);
  },

  calculateMaxIteration: (nodeCount: number) => {
    if (nodeCount >= 400) {
      return 100;
    }

    if (nodeCount > 100) {
      return 500;
    }

    return 1000;
  },

  getParent: (): Element => document.querySelector(`#${GRAPH_CONTAINER_ID}`) as Element
};

// TODO: remove this function when Backend sanitize the old process pairs
function sanitizeEdges(nodes: GraphNode[], edges: GraphEdge[]) {
  const availableNodesMap = nodes.reduce(
    (acc, node) => {
      acc[node.id] = node.id;

      return acc;
    },
    {} as Record<string, string>
  );

  return edges.filter(({ source, target }) => availableNodesMap[source] && availableNodesMap[target]);
}

// usageCount controls the curve of edges with the same source
function addCountUsageSource(edges: GraphEdge[]) {
  const sourceUsageCount = new Map<string, number>();

  return edges.map((edge) => {
    const { source } = edge;
    sourceUsageCount.set(source, (sourceUsageCount.get(source) || 0) + 1);

    return { ...edge, usageCount: sourceUsageCount.get(source) || 0 };
  });
}

// Identify edges that have a bidirectional direction
function markPairs(data: GraphEdge[]) {
  const set = new Set(data.map((item) => `${item.source}-${item.target}`));

  return data.map((item) => {
    const reversePair = `${item.target}-${item.source}`;
    const hasPair = set.has(reversePair);
    const isSame = item.source === item.target;

    return {
      ...item,
      hasPair,
      isSame
    };
  });
}
