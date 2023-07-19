import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Graph,
  Model,
  SELECTION_EVENT,
  GRAPH_LAYOUT_END_EVENT,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  TopologyView,
  GraphModel,
  NodeModel,
  EdgeModel
} from '@patternfly/react-topology';

import CustomControllers from './CustomControllers';
import CustomComponentFactory from './CustomFactory';
import CustomLayoutFactory, { LAYOUT_TYPE } from './CustomLayout';
import { TopologyAdapterProps } from './Graph.interfaces';
import { GraphController } from './services';

import './topologyAdaptor.css';

const GRAPH_PARAMS = {
  id: 'g1',
  type: 'graph',
  layout: LAYOUT_TYPE
};

const TopologyAdaptor: FC<TopologyAdapterProps> = function ({
  nodes,
  edges,
  onClickNode,
  onClickCombo,
  onClickEdge,
  onGetZoom,
  config
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLayoutSimulationEnd, setIsLayoutSimulationEnd] = useState(false);
  const nodesRef = useRef<NodeModel[]>();
  const edgesRef = useRef<EdgeModel[]>();

  const handleEndLayout = function ({ graph }: { graph: Graph }) {
    console.log('GRAPH_END_LAYOUT EVENT TRIGGERED');

    graph.getNodes().flatMap(GraphController.persistNodes);
    setIsLayoutSimulationEnd(true);
  };

  const handleSelectElement = useCallback(
    (ids: string[]) => {
      console.log('SELECT ITEM EVENT TRIGGGERED');

      const idSelected = ids[0];

      if (idSelected) {
        // select and edge. TODO: identify an edge using split('-to-') is not the proper way. Probably I Need an element/s more than ids
        if (onClickEdge && idSelected.split('-to-').length > 1) {
          const edge = edges.find(({ id }) => id === idSelected);
          setSelectedIds([idSelected]);

          return onClickEdge({ id: edge?.id, source: edge?.source });
        }

        // select a node
        const node = nodes.find(({ id }) => id === idSelected);

        if (onClickCombo && node?.type === 'group') {
          onClickCombo(node);
        } else {
          //if id !== frontend-xxxx process or id !== recommendation-service-xxx
          if (
            idSelected !== '99d0b02a-5a1b-47e7-8687-2e6f8c7e8c8b' &&
            idSelected !== '3861f850-687e-4f77-83cc-22074992c555'
          ) {
            onClickNode(node);
          }
        }
        setSelectedIds([idSelected]);
        GraphController.mouseOverNodeBehaviour(controller, idSelected);
      }
    },
    [onClickEdge, nodes, onClickCombo, edges, onClickNode]
  );

  // Initialization
  const controller = useMemo(() => {
    let graphModel = GRAPH_PARAMS as GraphModel;

    if (config?.zoom && config?.positions) {
      const positions = config?.positions ? JSON.parse(config?.positions) : { x: 0, y: 0 };
      const scale = Number(config?.zoom || 1);
      graphModel = { ...GRAPH_PARAMS, x: positions.x, y: positions.y, scale };
    }

    const model: Model = {
      nodes,
      edges,
      graph: graphModel
    };

    const newController = new Visualization();
    newController.registerLayoutFactory(CustomLayoutFactory);
    newController.registerComponentFactory(CustomComponentFactory);

    newController.addEventListener(GRAPH_LAYOUT_END_EVENT, handleEndLayout);
    newController.addEventListener(SELECTION_EVENT, handleSelectElement);

    console.log('INIT TOPOLOGY');
    newController.fromModel(model, true);
    console.log('END INIT TOPOLOGY');

    return newController;
  }, []);

  // Case: update the status of the topology.
  // It happens when we a node is added/removed or when byte/rate from nodes changes (this happen only if we check the checkbox 'show metric')
  useEffect(() => {
    if (
      isLayoutSimulationEnd &&
      controller &&
      (JSON.stringify(nodesRef.current) !== JSON.stringify(nodes) ||
        JSON.stringify(edgesRef.current) !== JSON.stringify(edges))
    ) {
      console.log('UPDATE MODEL');

      controller.fromModel({ ...controller.toModel().graph, nodes, edges }, true);
      nodesRef.current = nodes;
      edgesRef.current = edges;
    }
  }, [isLayoutSimulationEnd, controller, nodes, edges]);

  return (
    <TopologyView controlBar={<CustomControllers graph={controller.getGraph()} onGetZoom={onGetZoom} />}>
      <VisualizationProvider controller={controller}>
        <VisualizationSurface state={{ selectedIds }} />
      </VisualizationProvider>
    </TopologyView>
  );
};

export default TopologyAdaptor;
